import { Router } from "express";
import { Role } from "@prisma/client";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { UserController } from "./user.controller.js";
import { UserValidation } from "./user.validation.js";
 
const router = Router();
 
router.get("/me", auth(Role.ADMIN, Role.OWNER, Role.MEMBER), UserController.getMe);
 
router.patch(
  "/me",
  auth(Role.ADMIN, Role.OWNER, Role.MEMBER),
  validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateMe,
);
 
router.patch(
  "/me/change-password",
  auth(Role.ADMIN, Role.OWNER, Role.MEMBER),
  validateRequest(UserValidation.changePasswordZodSchema),
  UserController.changePassword,
);
 
export const UserRoutes = router;
