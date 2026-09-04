import type { ProjectStatus } from "../../../generated/prisma/index.js";
 
export interface ICreateProjectPayload {
  name: string;
  description?: string;
  teamId?: string;
  startDate?: string;
  endDate?: string;
}
 
export interface IUpdateProjectPayload {
  name?: string;
  description?: string;
  teamId?: string;
  startDate?: string;
  endDate?: string;
}
 
export interface IUpdateProjectStatusPayload {
  status: ProjectStatus;
}
