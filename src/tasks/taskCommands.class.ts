import { TaskApi } from "./taskApi.class.js";
import createDb from "../db.js";
import {
  ICreateTask,
  ITask,
  IUpdateTask,
  TaskStatus,
} from "../types/task.interface.js";
import { IParams } from "../types/queryParams.interface.js";
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

  async showTasksDashboard(
    hideBlockedTasks: boolean = false,
    showAll: boolean = false
  ): Promise<void> {
    let query: IParams = { limit: showAll ? Infinity : 10 };
    if (hideBlockedTasks) {
      query = { ...query, statusExcludeFilter: [TaskStatus.Blocked] };
    }
    // Get all tasks
    const tasks = await this.taskAPi.getAll(query);

    // Render the response
    render.displayTaskDashboard(tasks);
  }
  async createTask(task: ICreateTask): Promise<void> {
    const taskCreated = await this.taskAPi.create(task);

    render.successCreate(String(taskCreated.externalId));
  }
  async getTask(id: string): Promise<void> {
    const task = await this.taskAPi.get(id);

    render.successGet(task);
  }
  async updateTask(id: string, data: IUpdateTask): Promise<void> {
    const task = await this.taskAPi.update(id, data);

    render.successEdit(String(task.externalId));
  }
  async setStatusInProgress(id: string) {
    const task = await this.taskAPi.update(id, {
      status: TaskStatus.InProgress,
      startedAt: new Date(),
    });
    render.successEdit(String(task.externalId));
  }
  async setStatusBlocked(id: string) {
    const task = await this.taskAPi.update(id, {
      status: TaskStatus.Blocked,
    });
    render.successEdit(String(task.externalId));
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
    render.successEdit(String(task.externalId));
  }
  /**
   * Archive all tasks that have been completed
   */
  async clearCompletedTasks() {
    const tasks = await this.taskAPi.getAll({ limit: Infinity });
    const completed = tasks.data.filter((task: ITask) => task.status === TaskStatus.Done);
    this.archivedb.data.tasks.push(...completed);
    this.db.data.tasks = this.db.data.tasks.filter(
      (task: ITask) => task.status !== TaskStatus.Done
    );
    await this.db.write();
    await this.archivedb.write();
  }
  /**
   * Reindex tasks so that their IDs go from 1 to N
   */
  async reindexTasks() {
    // Get all tasks
    const tasks = await this.taskAPi.getAll({ limit: Infinity });
    let newId = 1;
    tasks.data.forEach(async (task: ITask) => {
      task.externalId = newId;
      newId += 1;
    });
    this.db.data.lastTaskId = newId - 1;
    await this.db.write();
  }

  /**
   * Show the agenda dashboard
   */
  async showAgendaDashboard(): Promise<void> {
    // Get all tasks
    const tasks = await this.taskAPi.getAll({
      statusExcludeFilter: [TaskStatus.Blocked, TaskStatus.Done],
      limit: Infinity,
    });

    // Render the response
    render.displayAgendaDashboard(tasks.data);
  }
  /**
   * Show the task in progress, or the next one to start
   */
  async showNow(): Promise<void> {
    const { data } = await this.taskAPi.getAll({
      statusExcludeFilter: [TaskStatus.Blocked, TaskStatus.Done],
      limit: Infinity, // the task in progress may rank below the first page
    });
    const current = data.find((t) => t.status === TaskStatus.InProgress);
    render.displayNow(current, current ? undefined : data[0]);
  }
  async deleteTask(id: string): Promise<void> {
    await this.taskAPi.delete(id);
    render.successDelete(id);
  }
}
