import { Router } from "express";
import { Role } from "../../../generated/prisma/index.js";
import { auth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { TaskController } from "./task.controller.js";
import { TaskValidation } from "./task.validation.js";
 
const router = Router();
 
router.post(
  "/projects/:projectId/tasks",
  auth(Role.OWNER, Role.MEMBER),
  validateRequest(TaskValidation.createTaskZodSchema),
  TaskController.createTask,
);
 
router.get("/projects/:projectId/tasks", auth(Role.ADMIN, Role.OWNER, Role.MEMBER), TaskController.getTasks);

router.get("/tasks/my-tasks", auth(Role.ADMIN, Role.OWNER, Role.MEMBER), TaskController.getMyTasks);
 
router.get("/tasks/:id", auth(Role.ADMIN, Role.OWNER, Role.MEMBER), TaskController.getSingleTask);
 
router.patch(
  "/tasks/:id",
  auth(Role.OWNER, Role.MEMBER),
  validateRequest(TaskValidation.updateTaskZodSchema),
  TaskController.updateTask,
);
 
router.patch(
  "/tasks/:id/status",
  auth(Role.OWNER, Role.MEMBER),
  validateRequest(TaskValidation.updateTaskStatusZodSchema),
  TaskController.updateTaskStatus,
);
 
router.post(
  "/tasks/:id/assign",
  auth(Role.OWNER),
  validateRequest(TaskValidation.assignTaskZodSchema),
  TaskController.assignTask,
);
 
router.delete("/tasks/:id", auth(Role.OWNER, Role.MEMBER), TaskController.deleteTask);
 
export const TaskRoutes = router;
