import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { AdminService } from "./admin.service.js";
 
const getUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getUsers(req.query);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
 
const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserStatus(req.params.id, req.body.status);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});
 
const getOrganizations = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getOrganizations(req.query);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organizations fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
 
const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAuditLogs(req.query);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Audit logs fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
 
const getPlatformStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getPlatformStats();
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Platform statistics fetched successfully",
    data: result,
  });
});
 
export const AdminController = {
  getUsers,
  updateUserStatus,
  getOrganizations,
  getAuditLogs,
  getPlatformStats,
};
