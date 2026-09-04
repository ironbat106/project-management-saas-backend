import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { SprintService } from "./sprint.service.js";
 
const createSprint = catchAsync(async (req: Request, res: Response) => {
  const result = await SprintService.createSprint(req.params.projectId, req.body, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Sprint created successfully",
    data: result,
  });
});
 
const getSprints = catchAsync(async (req: Request, res: Response) => {
  const result = await SprintService.getSprints(req.params.projectId, req.query, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sprints fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
 
const updateSprintStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await SprintService.updateSprintStatus(req.params.id, req.body.status, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Sprint status updated successfully",
    data: result,
  });
});
 
export const SprintController = {
  createSprint,
  getSprints,
  updateSprintStatus,
};
