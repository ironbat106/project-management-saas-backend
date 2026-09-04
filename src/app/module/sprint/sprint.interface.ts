import type { SprintStatus } from "../../../generated/prisma/index.js";
 
export interface ICreateSprintPayload {
  name: string;
  startDate: string;
  endDate: string;
}
 
export interface IUpdateSprintStatusPayload {
  status: SprintStatus;
}
