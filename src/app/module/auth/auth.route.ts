import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { auth } from "../../middleware/checkAuth.js";
import { authRateLimiter } from "../../middleware/rateLimiter.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { AuthController } from "./auth.controller.js";
import { AuthValidation } from "./auth.validation.js";
 
const router = Router();
 
router.post("/register", authRateLimiter, validateRequest(AuthValidation.registerZodSchema), AuthController.register);
 
router.post("/login", authRateLimiter, validateRequest(AuthValidation.loginZodSchema), AuthController.login);
 
router.post("/refresh-token", validateRequest(AuthValidation.refreshTokenZodSchema), AuthController.refreshToken);
 
router.post(
  "/logout",
  auth(Role.ADMIN, Role.OWNER, Role.MEMBER),
  validateRequest(AuthValidation.refreshTokenZodSchema),
  AuthController.logout,
);
 
export const AuthRoutes = router;