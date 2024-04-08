import { TaskApi } from "./taskApi.class.js";
import createDb from "../db.js";
import {
  ICreateTask,
  ITask,
  IUpdateTask,
  TaskStatus,
} from "../types/task.interface.js";
import render from "../render/index.js";
import fs from "fs";
import os from "os";
import path from "path";

export default class TaskCommands {
  archivedb: any;
  db: any;
  taskAPi: TaskApi;
  constructor() {}

  async setUpConfig(): Promise<void> {
    const dirPath = path.join(os.homedir(), ".keepon");
    // Create the directory if it doesn't exist
    fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) {
        throw err;
      }
    });
    // Create the db
    this.db = await createDb(path.join(dirPath, "tasks.json"));
    // Create the archive db
    this.archivedb = await createDb(path.join(dirPath, "archive.tasks.json"));
    this.taskAPi = new TaskApi(this.db);
  }

  async showTasksDashboard(): Promise<void> {
    // Get all tasks
    const tasks = await this.taskAPi.getAll();

    // Render the response
    render.displayTaskDashboard(tasks);
  }
  async createTask(task: ICreateTask): Promise<void> {
    const taskCreated = await this.taskAPi.create(task);

    render.successCreate(taskCreated._id);
  }
  async getTask(id: string): Promise<void> {
    const task = await this.taskAPi.get(id);

    render.successGet(task);
  }
  async updateTask(id: string, data: IUpdateTask): Promise<void> {
    const task = await this.taskAPi.update(id, data);

    render.successEdit(task._id);
  }
  async setStatusInProgress(id: string) {
    const task = await this.taskAPi.update(id, {
      status: TaskStatus.InProgress,
    });
    render.successEdit(task._id);
  }
  async setStatusBlocked(id: string) {
    const task = await this.taskAPi.update(id, {
      status: TaskStatus.Blocked,
    });
    render.successEdit(task._id);
  }
  /**
   *
   * @param id
   */
  async checkStatus(id: string) {
    const originaltask: ITask = await this.taskAPi.get(id);
    let status;
    if (originaltask.status === TaskStatus.Done) {
      status = TaskStatus.Pending;
    } else {
      status = TaskStatus.Done;
    }
    const task = await this.taskAPi.update(id, {
      status,
    });
    render.successEdit(task._id);
  }
  /**
   * Archive all tasks that have been completed
   */
  async clearCompletedTasks() {
    // Get all tasks
    const tasks = await this.taskAPi.getAll();
    tasks.data.forEach(async (task: ITask) => {
      if (task.status === TaskStatus.Done) {
        this.archivedb.data.tasks.push(task);
        this.db.data.tasks.splice(
          this.db.data.tasks.findIndex((t: ITask) => t._id === task._id),
          1
        );
      }
    });
    await this.db.write();
    await this.archivedb.write();
  }
}
