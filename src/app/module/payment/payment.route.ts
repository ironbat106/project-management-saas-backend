import { Router } from "express";
import { Role } from "@prisma/client";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { PaymentController } from "./payment.controller.js";
import { PaymentValidation } from "./payment.validation.js";
 
const router = Router();
 
router.post(
  "/checkout",
  auth(Role.OWNER),
  validateRequest(PaymentValidation.createCheckoutZodSchema),
  PaymentController.createCheckoutSession,
);
 
router.get(
  "/organizations/:organizationId",
  auth(Role.ADMIN, Role.OWNER, Role.MEMBER),
  PaymentController.getPaymentHistory,
);
 
export const PaymentRoutes = router;
