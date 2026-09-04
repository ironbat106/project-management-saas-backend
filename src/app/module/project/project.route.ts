import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { ProjectController } from "./project.controller.js";
import { ProjectValidation } from "./project.validation.js";
 
const router = Router();
 
router.post(
  "/organizations/:organizationId/projects",
  auth(Role.OWNER),
  validateRequest(ProjectValidation.createProjectZodSchema),
  ProjectController.createProject,
);
 
router.get(
  "/organizations/:organizationId/projects",
  auth(Role.ADMIN, Role.OWNER, Role.MEMBER),
  ProjectController.getProjects,
);
 
router.get("/projects/:id", auth(Role.ADMIN, Role.OWNER, Role.MEMBER), ProjectController.getSingleProject);
 
router.patch(
  "/projects/:id",
  auth(Role.OWNER),
  validateRequest(ProjectValidation.updateProjectZodSchema),
  ProjectController.updateProject,
);
 
router.patch(
  "/projects/:id/status",
  auth(Role.OWNER),
  validateRequest(ProjectValidation.updateProjectStatusZodSchema),
  ProjectController.updateProjectStatus,
);
 
router.delete("/projects/:id", auth(Role.OWNER), ProjectController.deleteProject);
 
export const ProjectRoutes = router;
