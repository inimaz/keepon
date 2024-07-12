import { TaskStatus } from "task.interface.js";

export interface IParams {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: string;
  hideBlockedTasks?: boolean;
  statusExcludeFilter?: TaskStatus[]; // Statuses to be excluded
}
