#! /usr/bin/env node

import figlet from "figlet";
import TaskCommands from "./tasks/taskCommands.class.js";
import * as commander from "commander";
const program = new commander.Command();

const taskCommands = new TaskCommands();

program
  .command("show", { isDefault: true })
  .description("Show all tasks")
  .action(async () => {
    welcome();
    await taskCommands.setUpConfig();
    await taskCommands.showTasksDashboard();
  });

function welcome() {
  console.log(figlet.textSync("keepOn"));
}
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
// program
//   .command("update")
//   .description("Update a task")
//   .argument("id", "id of the task to update")
//   .option("-t, --title", "title of the task")
//   .option("-d, --description", "description of the task")
//   .option("-u, --urgency", "how urgent this task is(0-10)")
//   .option("-i, --importance", "how important this task is(0-10)")
//   .option(
//     "-et --estimatedTime",
//     "how much time will it take to accomplish it (in min)"
//   )
//   .action(async (...args) => {
//     console.log(args);
//     const [id, title, description, urgency, importance, estimatedTime] = args;
//     await taskCommands.setUpConfig();
//     await taskCommands.updateTask(id, {
//       title,
//       description,
//       urgency,
//       importance,
//       estimatedTime,
//     });
//   });

program.parse(process.argv);
