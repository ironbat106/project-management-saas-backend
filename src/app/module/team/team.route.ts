import { Router } from "express";
import { Role } from "@prisma/client";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { TeamController } from "./team.controller.js";
import { TeamValidation } from "./team.validation.js";
 
const router = Router();
 
router.post(
  "/organizations/:organizationId/teams",
  auth(Role.OWNER),
  validateRequest(TeamValidation.createTeamZodSchema),
  TeamController.createTeam,
);
 
router.get(
  "/organizations/:organizationId/teams",
  auth(Role.ADMIN, Role.OWNER, Role.MEMBER),
  TeamController.getTeams,
);
 
router.post(
  "/teams/:teamId/members",
  auth(Role.OWNER),
  validateRequest(TeamValidation.addTeamMemberZodSchema),
  TeamController.addTeamMember,
);
 
router.delete("/teams/:teamId/members/:userId", auth(Role.OWNER), TeamController.removeTeamMember);
 
export const TeamRoutes = router;
