import chalk from "chalk";
import signale from "signale";
import { ITask, TaskStatus } from "../types/task.interface.js";

signale.config({ displayLabel: false });

const { await: wait, error, log, note, pending, success } = signale;
const { blue, green, grey, magenta, red, underline, yellow } = chalk;

function truncateString(str) {
  const numberOfChars = 50;
  if (str.length > numberOfChars) {
    return str.substring(0, numberOfChars) + "...";
  } else {
    return str;
  }
}
/**
 * This is to render the responses of the cli
 */
class Render {
  _displayTitle(title: string) {
    const titleObj = {
      prefix: "\n ",
      message: underline(title),
      suffix: "\n ",
    };
    return log(titleObj);
  }
  _buildPrefix(item: { _id: string; [key: string]: any }) {
    const prefix = [];

    const { _id: id } = item;
    prefix.push(" ".repeat(4 - String(id).length));
    prefix.push(grey(`${id}.`));

    return prefix.join(" ");
  }
  _buildMessage(item: ITask): string {
    const message = [];

    const { status, description, title } = item;
    const priority = item.priority;
    if (status === TaskStatus.Blocked) {
      message.push(red("🚫"));
    }

    if (
      ![TaskStatus.Done, TaskStatus.Blocked].includes(status) &&
      priority > 1
    ) {
      message.push(underline["yellow"](title));
      message.push(priority < 2 ? yellow("(!)") : red("(!!)"));
    } else {
      const messageTitle =
        status === TaskStatus.Done ? grey(`${title} //`) : title;
      message.push(messageTitle);
    }
    message.push(grey(truncateString(description)));

    return message.join(" ");
  }
  _getAge(birthday: Date) {
    const daytime = 24 * 60 * 60 * 1000;
    const age = Math.round(
      Math.abs((birthday.getTime() - Date.now()) / daytime)
    );
    return age === 0 ? "" : grey(`${age}d`);
  }
  _getEstimatedTime(estimatedTime: number) {
    return blue(`⌛${estimatedTime}min`);
  }

  displayTaskDashboard({
    data,
    total,
    limit,
    offset,
  }: {
    data: ITask[];
    total: number;
    limit: number;
    offset: number;
  }) {
    this._displayTitle("Dashboard");
    // The items of the dashboard
    data.forEach((item) => {
      const age = this._getAge(new Date(item.createdAt));
      const estimatedTime = this._getEstimatedTime(item.estimatedTime);

      const prefix = this._buildPrefix(item);
      const message = this._buildMessage(item);
      const suffix =
        age.length === 0 ? `${estimatedTime}` : `${estimatedTime} ${age}`;

      const msgObj = { prefix, message, suffix };

      return item.status === TaskStatus.Done
        ? success(msgObj)
        : item.status === TaskStatus.InProgress
        ? wait(msgObj)
        : item.status === TaskStatus.Blocked
        ? note(msgObj)
        : pending(msgObj);
    });
    // The footer of the dashboard
    log(grey(`\n${data.length} of ${total} tasks. Offset: ${offset}`));
  }
  displayAgendaDashboard(tasks: ITask[]) {
    // Show a line with the day of the week + day of the month

    const date = new Date();
    const day = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    log(underline(day));

    const now = date.getTime();

    // Show a column with the time of the day separated by 15 min
    const SLOT_DURATION = 15; // min
    const time = new Date(date);
    time.setHours(0, 0, 0, 0);
    time.setMinutes(Math.ceil(time.getMinutes() / 30) * 30);
    const timeSlots: string[] = [];
    while (time.getDate() === date.getDate()) {
      const timeString = time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      });

      const prefix = " ".repeat(6 - timeString.length);
      const message = timeString;

      if (time.getTime() > now) {
        timeSlots.push(prefix + message);
      }

      time.setMinutes(time.getMinutes() + SLOT_DURATION);
    }

    const agendaRows: { prefix: string; message: string; suffix: string }[] =
      [];
    // For each task, create an agendaRow showing when it will be started
    tasks.forEach((task) => {
      const prefix = timeSlots.shift();
      if (!prefix) return;
      // Remove as many slots as the estimated time - 1
      const slots = Math.ceil(task.estimatedTime / SLOT_DURATION) - 1;
      timeSlots.splice(0, slots);
      const message = task.title;
      const suffix = this._getEstimatedTime(task.estimatedTime);

      const msgObj = { prefix, message, suffix };
      agendaRows.push(msgObj);
    });
    agendaRows.forEach((row) => log(row));
  }
  successCreate(id) {
    const [prefix, suffix] = ["\n", grey(id)];
    const message = "Created task:";
    success({ prefix, message, suffix });
  }

  successEdit(id) {
    const [prefix, suffix] = ["\n", grey(id)];
    const message = "Updated item:";
    success({ prefix, message, suffix });
  }
  successGet(task: ITask) {
    const [prefix, suffix] = ["\n", `${grey(task._id)}\n`];
    const message = "Get task:";
    log({ prefix, message, suffix });
    log(grey(JSON.stringify(task, null, 4)));
  }
}

export default new Render();
