import type { TaskPriority, TaskStatus } from "../../../generated/prisma/index.js";
 
export interface ICreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  sprintId?: string;
  assigneeId?: string;
  dueDate?: string;
}
 
export interface IUpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  sprintId?: string;
  dueDate?: string;
}
 
export interface IUpdateTaskStatusPayload {
  status: TaskStatus;
}
 
export interface IAssignTaskPayload {
  assigneeId: string;
}
 
export interface ICreateSubtaskPayload {
  title: string;
}
 
export interface ICreateCommentPayload {
  content: string;
}
