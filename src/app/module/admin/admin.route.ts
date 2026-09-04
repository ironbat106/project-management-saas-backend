import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { AdminController } from "./admin.controller.js";
import { AdminValidation } from "./admin.validation.js";
 
const router = Router();
 
router.get("/users", auth(Role.ADMIN), AdminController.getUsers);
 
router.patch(
  "/users/:id/status",
  auth(Role.ADMIN),
  validateRequest(AdminValidation.updateUserStatusZodSchema),
  AdminController.updateUserStatus,
);
 
router.get("/organizations", auth(Role.ADMIN), AdminController.getOrganizations);
 
router.get("/audit-logs", auth(Role.ADMIN), AdminController.getAuditLogs);
 
router.get("/dashboard-stats", auth(Role.ADMIN), AdminController.getPlatformStats);
 
export const AdminRoutes = router;
