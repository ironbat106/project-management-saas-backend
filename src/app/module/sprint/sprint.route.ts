import { Router } from "express";
import { Role } from "@prisma/client";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { SprintController } from "./sprint.controller.js";
import { SprintValidation } from "./sprint.validation.js";
 
const router = Router();
 
router.post(
  "/projects/:projectId/sprints",
  auth(Role.OWNER),
  validateRequest(SprintValidation.createSprintZodSchema),
  SprintController.createSprint,
);
 
router.get("/projects/:projectId/sprints", auth(Role.ADMIN, Role.OWNER, Role.MEMBER), SprintController.getSprints);
 
router.patch(
  "/sprints/:id/status",
  auth(Role.OWNER),
  validateRequest(SprintValidation.updateSprintStatusZodSchema),
  SprintController.updateSprintStatus,
);
 
export const SprintRoutes = router;
