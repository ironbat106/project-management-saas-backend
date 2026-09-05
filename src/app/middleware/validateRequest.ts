import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodSchema } from "zod";

export const validateRequest = (schema: ZodSchema): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(result.error);
    }

    req.body = result.data;
    next();
  };
};