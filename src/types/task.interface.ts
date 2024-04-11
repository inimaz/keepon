export interface ITask {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  userId?: string;
  estimatedTime: number;
  importance: number;
  urgency: number;
  priority: number;
  labels: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date; // Date when it was set to in progress
  completedAt?: Date; // Date when it was set to done
}
export enum TaskStatus {
  Pending = "pending",
  InProgress = "in-progress",
  Blocked = "blocked",
  Done = "done",
}

export interface ICreateTask {
  title: string;
  description: string;
  estimatedTime: number;
  importance: number;
  urgency: number;
  labels?: string[];
  dueDate?: Date;
}
export interface IUpdateTask {
  title?: string;
  description?: string;
  estimatedTime?: number;
  importance?: number;
  urgency?: number;
  labels?: string[];
  dueDate?: Date;
  completed?: boolean;
  status?: TaskStatus;
}
