import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { OrganizationController } from "./organization.controller.js";
import { OrganizationValidation } from "./organization.validation.js";
 
const router = Router();
 
router.post(
  "/",
  auth(Role.OWNER),
  validateRequest(OrganizationValidation.createOrganizationZodSchema),
  OrganizationController.createOrganization,
);
 
router.get("/", auth(Role.ADMIN, Role.OWNER, Role.MEMBER), OrganizationController.getOrganizations);
 
router.get("/:id", auth(Role.ADMIN, Role.OWNER, Role.MEMBER), OrganizationController.getSingleOrganization);
 
router.patch(
  "/:id",
  auth(Role.ADMIN, Role.OWNER),
  validateRequest(OrganizationValidation.updateOrganizationZodSchema),
  OrganizationController.updateOrganization,
);
 
router.delete("/:id", auth(Role.ADMIN, Role.OWNER), OrganizationController.deleteOrganization);
 
export const OrganizationRoutes = router;
