#! /usr/bin/env node

import figlet from "figlet";
import TaskCommands from "./tasks/taskCommands.class.js";
import * as commander from "commander";
import { IUpdateTask } from "task.interface.js";
const program = new commander.Command();

const taskCommands = new TaskCommands();

program
  .command("show", { isDefault: true })
  .description("Show all tasks")
  .option("-b, --hideBlock", "hide blocked tasks")
  .action(async (options) => {
    welcome();
    const { hideBlock } = options;
    await taskCommands.setUpConfig();
    await taskCommands.showTasksDashboard(hideBlock);
  });

function welcome() {
  console.log(figlet.textSync("keepOn"));
}

program
  .command("block")
  .description("Set the status of a task to blocked")
  .argument("id", "id of the task that is blocked")
  .action(async (...args) => {
    const [id] = args;
    await taskCommands.setUpConfig();
    await taskCommands.setStatusBlocked(id);
  });

program
  .command("check")
  .description("Check/uncheck task")
  .argument("id", "id of the task to check")
  .action(async (...args) => {
    const [id] = args;
    await taskCommands.setUpConfig();
    await taskCommands.checkStatus(id);
  });

program
  .command("clear")
  .description("Clear all completed tasks")
  .action(async (...args) => {
    const [id] = args;
    await taskCommands.setUpConfig();
    await taskCommands.clearCompletedTasks();
  });
program
  .command("create")
  .description("Create a new task")
  .argument("title", "title of the task")
  .argument("[description]", "description of the task", "")
  .argument("[urgency]", "how urgent this task is(0-10)", 5)
  .argument("[importance]", "how important this task is(0-10)", 5)
  .argument(
    "[estimatedTime]",
    "how much time will it take to accomplish it (in min)",
    5
  )
  .action(async (...args) => {
    const [title, description, urgency, importance, estimatedTime] = args;
    await taskCommands.setUpConfig();
    await taskCommands.createTask({
      title,
      description,
      urgency: parseInt(urgency),
      importance: parseInt(importance),
      estimatedTime: parseInt(estimatedTime),
    });
  });
program
  .command("get")
  .description("Get all info of a task")
  .argument("id", "id of the task")
  .action(async (...args) => {
    const [id] = args;
    await taskCommands.setUpConfig();
    await taskCommands.getTask(id);
  });

program
  .command("start")
  .description("Start a task")
  .argument("id", "id of the task to start")
  .action(async (...args) => {
    const [id] = args;
    await taskCommands.setUpConfig();
    await taskCommands.setStatusInProgress(id);
  });
program
  .command("update")
  .description("Update a task")
  .argument("id", "id of the task to update")
  .option("-t, --title <string>", "title of the task")
  .option("-d, --description <string>", "description of the task")
  .option("-u, --urgency <int>", "how urgent this task is(0-10)")
  .option("-i, --importance <int>", "how important this task is(0-10)")
  .option(
    "-et --estimatedTime <int>",
    "how much time will it take to accomplish it (in min)"
  )
  .action(async (id, options) => {
    const { title, description, urgency, importance, estimatedTime } = options;
    let taskData: IUpdateTask = {};
    if (title !== undefined) taskData.title = title;
    if (description !== undefined) taskData.description = description;
    if (urgency !== undefined) taskData.urgency = parseInt(urgency);
    if (importance !== undefined) taskData.importance = parseInt(importance);
    if (estimatedTime !== undefined)
      taskData.estimatedTime = parseInt(estimatedTime);

    await taskCommands.setUpConfig();
    await taskCommands.updateTask(id, taskData);
  });

program
  .command("agenda")
  .alias("a")
  .description(
    "Show the agenda of today as if you had to do all the tasks today"
  )
  .action(async () => {
    await taskCommands.setUpConfig();
    await taskCommands.showAgendaDashboard();
  });

program
  .command("reindex")
  .description("Reindex tasks so that their IDs go from 1 to N")
  .action(async () => {
    await taskCommands.setUpConfig();
    await taskCommands.reindexTasks();
  });

program.parse(process.argv);
