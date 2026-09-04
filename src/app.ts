import cors from "cors";
import express, { type Application, type Request, type Response } from "express";
import helmet from "helmet";
import httpStatus from "http-status";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/notFound.js";
import { apiRateLimiter } from "./app/middleware/rateLimiter.js";
import { PaymentController } from "./app/module/payment/payment.controller.js";
import router from "./app/route/index.js";

const app: Application = express();

app.use(helmet());

app.use(cors({ 
  origin: true, 
  credentials: true 
}));

app.use(apiRateLimiter);

app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleWebhook
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Project Management SaaS server is running",
  });
});

app.use("/api/v1", router);

app.use(notFound);

app.use(globalErrorHandler);

export default app;