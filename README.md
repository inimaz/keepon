# keepOn

Track your tasks and improve your time management with a simple cli.

# Install

```
npm install -g .
```

# Usage

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
  help [command]                                                       display help for command
```

If no command is passed, by default it will show the dashboard (`k show` command).

```sh
$ k
  _                    ___
 | | _____  ___ _ __  / _ \ _ __
 | |/ / _ \/ _ \ '_ \| | | | '_ \
 |   <  __/  __/ |_) | |_| | | | |
 |_|\_\___|\___| .__/ \___/|_| |_|
               |_|

  Dashboard

    2. ✔  Add repo to git
    1. ✔  Render title Render title in tasks list
    3. ✔  Add global alias Global alias to keepon
    7. ☐  Start task (!) Update a task to in progress w...
    5. ☐  Show only tasks not completed
    6. ☐  Clear done tasks Archive all the tasks that are...
    4. ☐  Start unit tests Needed to keep quality over ti...

7 of 7 tasks. Offset: 0
```

# How the priority is calculated

The priority gives the order in the dashboard. It is calculated based on the urgency, the estimated time and importance of the task. The formula is:

```
priority = urgency * importance / estimatedTime
```
