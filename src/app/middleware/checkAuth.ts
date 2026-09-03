import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../config/index.js";
import type { Role } from "../../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { jwtUtils } from "../utils/jwt.js";
 
export interface RequestUser {
  userId: string;
  name: string;
  email: string;
  role: Role;
}
 
declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
 
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
 
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not logged in. Please log in to access this resource.");
    }
 
    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);
 
    if (!verifiedToken.success || !verifiedToken.data) {
      throw new AppError(httpStatus.UNAUTHORIZED, verifiedToken.error || "Invalid or expired access token");
    }
 
    const { userId, email, name, role } = verifiedToken.data as RequestUser;
 
    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new AppError(httpStatus.FORBIDDEN, "Forbidden. You do not have permission to access this resource.");
    }
 
    const user = await prisma.user.findUnique({ where: { id: userId } });
 
    if (!user || user.isDeleted || user.status === "DELETED") {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not found. Please log in again.");
    }
 
    if (user.status === "BLOCKED") {
      throw new AppError(httpStatus.FORBIDDEN, "Your account has been blocked. Please contact support.");
    }
 
    req.user = { userId, email, name, role };
 
    next();
  });
};
