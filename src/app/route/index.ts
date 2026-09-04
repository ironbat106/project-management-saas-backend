import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route.js";
import { OrganizationRoutes } from "../module/organization/organization.route.js";
import { UserRoutes } from "../module/user/user.route.js";
 
const router = Router();
 
const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/organizations", route: OrganizationRoutes },
];
 
moduleRoutes.forEach(({ path, route }) => router.use(path, route));
 
export default router;
