import { TaskApi } from "./taskApi.class.js";
import createDb from "../db.js";
import { ICreateTask, IUpdateTask } from "task.interface.js";
import render from "../render/index.js";
import fs from "fs";
import os from "os";
import path from "path";

export default class TaskCommands {
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
    this.taskAPi = new TaskApi(this.db);
  }

  async showTasksDashboard(): Promise<void> {
    // Get all tasks
    const tasks = await this.taskAPi.getAll();

    // Render the response
    render.displayTaskDashboard(tasks);
    // console.log("Dashboard");
    // console.log(chalk.bgBlue(JSON.stringify(tasks, null, 2)));
  }
  async createTask(task: ICreateTask): Promise<void> {
    // const task: ICreateTask = {
    //   title: "First task",
    //   description: "This is the first task",
    //   estimatedTime: 45,
    //   importance: 1,
    //   urgency: 10,
    // };
    const taskCreated = await this.taskAPi.create(task);

    render.successCreate(taskCreated._id);
    // console.log("Task created");
    // console.log(chalk.green(JSON.stringify(taskCreated, null, 2)));
  }
  async getTask(): Promise<void> {
    const id = "1";
    const task = await this.taskAPi.get(id);

    render.successGet(task);
    // console.log(`Retrieved task ${id}`);
    // console.log(chalk.yellow(JSON.stringify(task, null, 2)));
  }
  async updateTask(id: string, data: IUpdateTask): Promise<void> {
    // const id = "1";
    // const task = await this.taskAPi.update(id, {
    //   estimatedTime: 32,
    //   importance: 10,
    // });
    const task = await this.taskAPi.update(id, data);

    render.successEdit(task._id);
    // console.log(`Updated task ${id}`);
    // console.log(chalk.gray(JSON.stringify(task, null, 2)));
  }
}
