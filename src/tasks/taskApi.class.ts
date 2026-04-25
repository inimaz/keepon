import { IParams } from "queryParams.interface.js";
import {
  ICreateTask,
  ITask,
  IUpdateTask,
  TaskStatus,
} from "../types/task.interface.js";

export class TaskApi {
  db: any;

  constructor(db) {
    this.db = db;
    this.ensureExternalIds();
  }
  ensureExternalIds() {
    const tasks = this.getTasks();
    if (tasks.length === 0) return;
    let nextId: number = tasks[0].externalId || 0;
    tasks.forEach((task: ITask) => {
      if (task.externalId === undefined || task.externalId === null) {
        nextId += 1;
        task.externalId = nextId;
        this.db.data.lastTaskId = nextId;
      } else {
        nextId = task.externalId;
      }
    });
  }
  getTasks(): ITask[] {
    return this.db.data.tasks;
  }
  _getByExternalId(tasks: ITask[], externalId: number): ITask {
    const task = tasks.find((task) => task.externalId === externalId);
    if (task === undefined) throw new Error("Task not found");
    return task;
  }
  _getById(tasks: ITask[], id: string): ITask {
    const externalId = this.parseExternalId(id);
    return this._getByExternalId(tasks, externalId);
  }
  parseExternalId(id: string): number {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error("Invalid task ID: must be a positive integer");
    }
    return parsed;
  }
  async get(id: string): Promise<ITask> {
    const tasks = await this.db.data.tasks;
    return this._getById(tasks, id);
  }
  async getAll(params?: IParams): Promise<{
    data: ITask[];
    total: number;
    limit: number;
    offset: number;
  }> {
    params = {
      limit: 10,
      offset: 0,
      sort: "priority",
      order: "desc",
      ...params,
    };

    let tasks: ITask[] = await this.db.data.tasks;

    if (params.hideBlockedTasks) {
      tasks = tasks.filter((task) => task.status !== TaskStatus.Blocked);
    }
    if (params.statusExcludeFilter) {
      tasks = tasks.filter(
        (task) => !params.statusExcludeFilter.includes(task.status)
      );
    }
    // Apply sorting
    tasks.sort((a, b) => {
      return params.order === "asc"
        ? a[params.sort] - b[params.sort]
        : b[params.sort] - a[params.sort];
    });
    // Apply pagination
    const subset = tasks.slice(params.offset, params.offset + params.limit);
    return {
      data: subset,
      total: tasks.length,
      limit: params.limit,
      offset: params.offset,
    };
  }
  async create(data: ICreateTask): Promise<ITask> {
    const tasks: ITask[] = await this.getTasks();
    const now = new Date();
    const externalId = this.db.data.lastTaskId + 1;
    const task: ITask = {
      ...data,
      _id: crypto.randomUUID(),
      externalId,
      priority: calculatePriority(data),
      createdAt: now,
      updatedAt: now,
      status: TaskStatus.Pending,
      labels: data.labels || [],
      timeSpent: 0,
    };
    tasks.push(task);
    this.db.data.lastTaskId = externalId;
    await this.db.write();
    return task;
  }
  async update(id: string, data: IUpdateTask): Promise<ITask> {
    const currentDate = new Date();
    const tasks = await this.db.data.tasks;
    let task = this._getById(tasks, id);
    const oldStatus = task.status;
    const newStatus = data.status;

    // Initialize timeSpent if it doesn't exist (for older tasks)
    if (task.timeSpent === undefined) task.timeSpent = 0;

    // Auto-stop other tasks when starting a new one
    if (newStatus === TaskStatus.InProgress) {
      for (const t of tasks) {
        if (t.status === TaskStatus.InProgress && t.externalId !== task.externalId && t.lastStartedAt) {
          const started = new Date(t.lastStartedAt);
          const duration = currentDate.getTime() - started.getTime();
          t.timeSpent += duration;
          t.lastStartedAt = undefined;
          t.status = TaskStatus.Pending;
        }
      }
    }

    // Handle status transitions for time tracking
    if (newStatus !== undefined && newStatus !== oldStatus) {
      if (newStatus === TaskStatus.InProgress) {
        task.startedAt = currentDate;
        task.lastStartedAt = currentDate;
      } else {
        // Moving away from InProgress (to Done, Blocked, or Pending)
        if (oldStatus === TaskStatus.InProgress && task.lastStartedAt) {
          const started = new Date(task.lastStartedAt);
          const duration = currentDate.getTime() - started.getTime();
          task.timeSpent += duration;
          task.lastStartedAt = undefined;
        }

        if (newStatus === TaskStatus.Done) {
          task.completedAt = currentDate;
        }
      }
    }

    // Update the task object with provided data
    task = {
      ...task,
      ...data,
      updatedAt: currentDate,
    };
    // Recalculate priority
    task = { ...task, priority: calculatePriority(task as any) };
    // Update the task in the array
    const index = tasks.findIndex((t: ITask) => t.externalId === task.externalId);
    if (index !== -1) {
      tasks[index] = task;
    }
    
    await this.db.write();
    return task;
  }
  async delete(id: string): Promise<void> {
    const externalId = this.parseExternalId(id);
    const tasks = await this.db.data.tasks;
    const index = tasks.findIndex((task: ITask) => task.externalId === externalId);
    if (index === -1) {
      throw new Error("Task not found");
    }
    tasks.splice(index, 1);
    await this.db.write();
  }
}

/**
 * Calculate the priority of a task based on the importance, urgency and estimated time
 * @param task
 * @returns
 */
export const calculatePriority = (task: ICreateTask): number => {
  if (!task.estimatedTime) throw new Error("Task must have an estimated time");
  if (!task.importance) throw new Error("Task must have an importance");
  if (!task.urgency) throw new Error("Task must have an urgency");
  return (
    Math.floor((1000 * (task.importance * task.urgency)) / task.estimatedTime) /
    1000
  );
};
