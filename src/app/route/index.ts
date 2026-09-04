import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route.js";
import { OrganizationRoutes } from "../module/organization/organization.route.js";
import { TeamRoutes } from "../module/team/team.route.js";
import { UserRoutes } from "../module/user/user.route.js";
 
const router = Router();
 
const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/organizations", route: OrganizationRoutes },
  // Team routes define their own full paths internally (e.g.
  // "/organizations/:organizationId/teams" and "/teams/:teamId/members"),
  // so they are mounted directly at the router root ("/").
  { path: "/", route: TeamRoutes },
];
 
moduleRoutes.forEach(({ path, route }) => router.use(path, route));
 
export default router;