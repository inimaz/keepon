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
  async getAll(
    params?: IParams
  ): Promise<{ data: ITask[]; total: number; limit: number; offset: number }> {
    params = {
      limit: 10,
      offset: 0,
      sort: "priority",
      order: "desc",
      ...params,
    };

    const tasks: ITask[] = await this.db.data.tasks;
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
    };
    tasks.push(task);
    this.db.data.lastTaskId = parseInt(id);
    await this.db.write();
    return task;
  }
  async update(id: string, data: IUpdateTask): Promise<ITask> {
    const tasks = await this.db.data.tasks;
    let task = this._getById(tasks, id);
    task = {
      ...task,
      ...data,
      updatedAt: new Date(),
    };
    // Recalculate priority
    task = { ...task, priority: calculatePriority(task) };
    // Update the task
    tasks[tasks.findIndex((task: ITask) => task._id === id)] = task;
    await this.db.write();
    return task;
  }
  async delete(id: string): Promise<void> {
    throw new Error("Method not implemented");
  }
}

/**
 * Calculate the priority of a task based on the importance, urgency and estimated time
 * @param task
 * @returns
 */
const calculatePriority = (task: ICreateTask): number => {
  if (!task.estimatedTime) throw new Error("Task must have an estimated time");
  if (!task.importance) throw new Error("Task must have an importance");
  if (!task.urgency) throw new Error("Task must have an urgency");
  return (
    Math.floor((1000 * (task.importance * task.urgency)) / task.estimatedTime) /
    1000
  );
};
