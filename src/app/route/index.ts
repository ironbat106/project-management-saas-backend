import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route.js";
 
const router = Router();
 
const moduleRoutes = [{ path: "/auth", route: AuthRoutes }];
 
moduleRoutes.forEach(({ path, route }) => router.use(path, route));
 
export default router;
