import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { TaskService } from "./task.service.js";
 
const createTask = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.createTask(req.params.projectId, req.body, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Task created successfully",
    data: result,
  });
});
 
const getTasks = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.getTasks(req.params.projectId, req.query, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tasks fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
 
const getMyTasks = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.getMyTasks(req.query, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your tasks fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
 
const getSingleTask = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.getSingleTask(req.params.id, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task fetched successfully",
    data: result,
  });
});
 
const updateTask = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.updateTask(req.params.id, req.body, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task updated successfully",
    data: result,
  });
});
 
const updateTaskStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.updateTaskStatus(req.params.id, req.body.status, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task status updated successfully",
    data: result,
  });
});
 
const assignTask = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskService.assignTask(req.params.id, req.body.assigneeId, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task assigned successfully",
    data: result,
  });
});
 
const deleteTask = catchAsync(async (req: Request, res: Response) => {
  await TaskService.deleteTask(req.params.id, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task deleted successfully",
    data: null,
  });
});
 
export const TaskController = {
  createTask,
  getTasks,
  getMyTasks,
  getSingleTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
};
