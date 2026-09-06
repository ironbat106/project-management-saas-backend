import type { SprintStatus } from "@prisma/client";
 
export interface ICreateSprintPayload {
  name: string;
  startDate: string;
  endDate: string;
}
 
export interface IUpdateSprintStatusPayload {
  status: SprintStatus;
}
