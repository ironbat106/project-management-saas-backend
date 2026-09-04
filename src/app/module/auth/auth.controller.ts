import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { AuthService } from "./auth.service.js";
 
const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
 
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Account created successfully",
    data: result,
  });
});
 
const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully",
    data: result,
  });
});
 
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.refreshToken(req.body.refreshToken);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New access token generated successfully",
    data: result,
  });
});
 
const logout = catchAsync(async (req: Request, res: Response) => {
  await AuthService.logout(req.body.refreshToken);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});
 
const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.googleLogin(req.body);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in with Google successfully",
    data: result,
  });
});
 
export const AuthController = {
  register,
  login,
  refreshToken,
  logout,
  googleLogin,
};
