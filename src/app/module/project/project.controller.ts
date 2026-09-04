import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { ProjectService } from "./project.service.js";
 
const createProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.createProject(req.params.organizationId, req.body, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Project created successfully",
    data: result,
  });
});
 
const getProjects = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.getProjects(req.params.organizationId, req.query, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Projects fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
 
const getSingleProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.getSingleProject(req.params.id, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project fetched successfully",
    data: result,
  });
});
 
const updateProject = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.updateProject(req.params.id, req.body, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project updated successfully",
    data: result,
  });
});
 
const updateProjectStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.updateProjectStatus(req.params.id, req.body.status, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project status updated successfully",
    data: result,
  });
});
 
const deleteProject = catchAsync(async (req: Request, res: Response) => {
  await ProjectService.deleteProject(req.params.id, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project deleted successfully",
    data: null,
  });
});
 
export const ProjectController = {
  createProject,
  getProjects,
  getSingleProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
};
