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
  }
  _getById(tasks: ITask[], id: string): ITask {
    const task = tasks.find((task) => task._id === id);
    if (task === undefined) throw new Error("Task not found");
    return task;
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
    const tasks = await this.db.data.tasks;
    const now = new Date();
    const id = `${
      this.db.data.lastTaskId !== undefined ? this.db.data.lastTaskId + 1 : 1
    }`;
    const task: ITask = {
      ...data,
      _id: id,
      priority: calculatePriority(data),
      createdAt: now,
      updatedAt: now,
      status: TaskStatus.Pending,
      labels: data.labels || [],
      timeSpent: 0,
    };
    tasks.push(task);
    this.db.data.lastTaskId = parseInt(id);
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

    // Handle status transitions for time tracking
    if (newStatus !== undefined && newStatus !== oldStatus) {
      if (newStatus === TaskStatus.InProgress) {
        task.startedAt = currentDate;
        task.lastStartedAt = currentDate;
      } else {
        // Moving away from InProgress (to Done, Blocked, or Pending)
        if (oldStatus === TaskStatus.InProgress && task.lastStartedAt) {
          const duration = currentDate.getTime() - task.lastStartedAt.getTime();
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
    const index = tasks.findIndex((t: ITask) => t._id === id);
    if (index !== -1) {
      tasks[index] = task;
    }
    
    await this.db.write();
    return task;
  }
  async delete(id: string): Promise<void> {
    const tasks = await this.db.data.tasks;
    const index = tasks.findIndex((task: ITask) => task._id === id);
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
