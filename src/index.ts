#! /usr/bin/env node

import figlet from "figlet";
import TaskCommands from "./tasks/taskCommands.class.js";
import { parseMinutes, parseRating } from "./tasks/taskApi.class.js";
import * as commander from "commander";
import { IUpdateTask } from "task.interface.js";
const program = new commander.Command();

const taskCommands = new TaskCommands();

program.name("k");

program
  .command("show", { isDefault: true })
  .description("Show all tasks")
  .option("-a, --all", "show all tasks, not just the first 10")
  .option("-b, --hideBlock", "hide blocked tasks")
  .action(async (options) => {
    welcome();
    const { all, hideBlock } = options;
    await taskCommands.setUpConfig();
    await taskCommands.showTasksDashboard(hideBlock, all);
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
  .description("Archive all completed tasks")
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
  .argument("[urgency]", "how urgent this task is(1-10)", "5")
  .argument("[importance]", "how important this task is(1-10)", "5")
  .argument(
    "[estimatedTime]",
    "how much time will it take to accomplish it (in min)",
    "5"
  )
  .option("-d, --description <string>", "description of the task")
  .option("-u, --urgency <int>", "how urgent this task is(1-10)")
  .option("-i, --importance <int>", "how important this task is(1-10)")
  .option("-et, --estimatedTime <int>", "how much time will it take to accomplish it (in min)")
  .action(
    async (
      title: string,
      description: string,
      urgency: string,
      importance: string,
      estimatedTime: string,
      options
    ) => {
      await taskCommands.setUpConfig();
      await taskCommands.createTask({
        title,
        description: options.description ?? description,
        urgency: parseRating("Urgency", options.urgency ?? urgency),
        importance: parseRating("Importance", options.importance ?? importance),
        estimatedTime: parseMinutes(options.estimatedTime ?? estimatedTime),
      });
    }
  );
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
  .option("-u, --urgency <int>", "how urgent this task is(1-10)")
  .option("-i, --importance <int>", "how important this task is(1-10)")
  .option(
    "-et --estimatedTime <int>",
    "how much time will it take to accomplish it (in min)"
  )
  .action(async (id, options) => {
    const { title, description, urgency, importance, estimatedTime } = options;
    let taskData: IUpdateTask = {};
    if (title !== undefined) taskData.title = title;
    if (description !== undefined) taskData.description = description;
    if (urgency !== undefined) taskData.urgency = parseRating("Urgency", urgency);
    if (importance !== undefined)
      taskData.importance = parseRating("Importance", importance);
    if (estimatedTime !== undefined)
      taskData.estimatedTime = parseMinutes(estimatedTime);
    if (Object.keys(taskData).length === 0) {
      throw new Error(
        "Nothing to update. Pass at least one of --title, --description, --urgency, --importance or --estimatedTime."
      );
    }

    await taskCommands.setUpConfig();
    await taskCommands.updateTask(id, taskData);
  });

program
  .command("delete")
  .description("Delete a task")
  .argument("id", "id of the task to delete")
  .action(async (...args) => {
    const [id] = args;
    await taskCommands.setUpConfig();
    await taskCommands.deleteTask(id);
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
  .command("now")
  .description("Show the task in progress, or the next one to start")
  .action(async () => {
    await taskCommands.setUpConfig();
    await taskCommands.showNow();
  });

program
  .command("reindex")
  .description("Reindex tasks so that their IDs go from 1 to N")
  .action(async () => {
    await taskCommands.setUpConfig();
    await taskCommands.reindexTasks();
  });

// Stop quietly when the reader goes away, e.g. k show | head
process.stdout.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EPIPE") process.exit(0);
  throw err;
});

program.parseAsync(process.argv).catch((err) => {
  console.error(process.env.DEBUG ? err : err.message);
  process.exitCode = 1;
});
