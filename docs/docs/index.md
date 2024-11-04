# Home

![KeepOn](https://raw.githubusercontent.com/inimaz/keepon/main/docs/media/keepOn-logo.png)

_Track your tasks and improve your time management with a simple cli._

![alt text](https://raw.githubusercontent.com/inimaz/keepon/main/docs/media/image.png)

## How it works

1. Add your tasks with the urgency, importance and estimated time in minutes
1. `keepOn` will prioritize those tasks base on your inputs and tell you which task to do next

   ![alt text](https://raw.githubusercontent.com/inimaz/keepon/main/docs/media/keepOn-createTask.gif)

## Install

```
npm install -g @inimaz/keepon
```

## Usage

See all commands with `k -h`

```sh
$ k -h
Usage: k [options] [command]

Options:
  -h, --help                                                           display help for command

Commands:
  show [options]                                                       Show all tasks
  block <id>                                                           Set the status of a task to blocked
  check <id>                                                           Check/uncheck task
  clear                                                                Clear all completed tasks
  create <title> [description] [urgency] [importance] [estimatedTime]  Create a new task
  get <id>                                                             Get all info of a task
  start <id>                                                           Start a task
  update [options] <id>                                                Update a task
  agenda|a                                                             Show the agenda of today as if you had to do all the tasks today
  reindex                                                              Reindex tasks so that their IDs go from 1 to N
  help [command]                                                       display help for command
```

If no command is passed, by default it will show the dashboard (`k show` command).
![alt text](https://raw.githubusercontent.com/inimaz/keepon/main/docs/media/keepOn-show.gif)

## How the priority is calculated

The priority gives the order in the dashboard. It is calculated based on the urgency, the estimated time and importance of the task. The formula is:

```
priority = urgency * importance / estimatedTime
```

## External links

- [Article on Medium](https://medium.com/@inigo.imazchacon/how-i-use-keepon-to-keep-up-with-my-tasks-507a08d8ee9c)
- [Github repo](https://github.com/inimaz/keepon)
