import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { UserService } from "./user.service.js";
 
const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getMe(req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile fetched successfully",
    data: result,
  });
});
 
const updateMe = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateMe(req.user as RequestUser, req.body);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});
 
const changePassword = catchAsync(async (req: Request, res: Response) => {
  await UserService.changePassword(req.user as RequestUser, req.body);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});
 
export const UserController = {
  getMe,
  updateMe,
  changePassword,
};
