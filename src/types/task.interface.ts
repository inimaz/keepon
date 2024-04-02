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
}
export enum TaskStatus {
  Pending = "pending",
  InProgress = "in-progress",
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
}
