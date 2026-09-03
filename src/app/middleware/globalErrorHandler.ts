import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/index.js";
import config from "../config/index.js";
import { AppError } from "../utils/AppError.js";
 

export const globalErrorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (config.node_env === "development") {
    console.error("Global Error Handler caught:", err);
  }
 
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || "Something went wrong";
  let errors: unknown[] = [];
 
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid data was provided to the database.";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = httpStatus.CONFLICT;
      const target = (err.meta?.target as string[] | undefined)?.join(", ");
      message = `A record with this ${target || "value"} already exists.`;
    } else if (err.code === "P2003") {
      statusCode = httpStatus.BAD_REQUEST;
      message = "This action violates a foreign key relationship.";
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND;
      message = "The requested record could not be found.";
    } else {
      statusCode = httpStatus.BAD_REQUEST;
      message = "A database error occurred.";
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Could not connect to the database.";
  } else if (err.name === "TokenExpiredError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Your session has expired. Please log in again.";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid access token.";
  } else if (err instanceof Error) {
    message = err.message;
  }
 
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: config.node_env === "development" ? err.stack : undefined,
  });
};
