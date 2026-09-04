import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route.js";
import { OrganizationRoutes } from "../module/organization/organization.route.js";
import { PaymentRoutes } from "../module/payment/payment.route.js";
import { ProjectRoutes } from "../module/project/project.route.js";
import { SprintRoutes } from "../module/sprint/sprint.route.js";
import { TaskRoutes } from "../module/task/task.route.js";
import { TeamRoutes } from "../module/team/team.route.js";
import { UserRoutes } from "../module/user/user.route.js";
 
const router = Router();
 
const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/organizations", route: OrganizationRoutes },
  { path: "/payments", route: PaymentRoutes },
  { path: "/", route: TeamRoutes },
  { path: "/", route: ProjectRoutes },
  { path: "/", route: SprintRoutes },
  { path: "/", route: TaskRoutes },
];
 
moduleRoutes.forEach(({ path, route }) => router.use(path, route));
 
export default router;