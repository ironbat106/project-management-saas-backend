import type { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config/index.js";
import { stripe } from "../../lib/stripe.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { PaymentService } from "./payment.service.js";
 
const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.createCheckoutSession(req.body, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checkout session created successfully",
    data: result,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
 
  if (!signature) {
    throw new AppError(httpStatus.BAD_REQUEST, "Missing stripe-signature header");
  }
 
  let event;
 
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.stripe_webhook_secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    throw new AppError(httpStatus.BAD_REQUEST, `Webhook signature verification failed: ${message}`);
  }
 
  await PaymentService.handleWebhookEvent(event);
 

  res.status(httpStatus.OK).json({ received: true });
});
 
const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getPaymentHistory(req.params.organizationId, req.query, req.user as RequestUser);
 
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment history fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
 
export const PaymentController = {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory,
};
