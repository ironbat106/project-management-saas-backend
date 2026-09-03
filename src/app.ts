import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import helmet from "helmet";
import httpStatus from "http-status";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/notFound.js";
import { apiRateLimiter } from "./app/middleware/rateLimiter.js";
 
const app: Application = express();
 

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(apiRateLimiter);
 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 

app.get("/", (_req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Project Management SaaS server is running",
  });
});
 
app.use(notFound);
app.use(globalErrorHandler);
 
export default app;
