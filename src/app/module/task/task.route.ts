import { Router } from "express";
import { Role } from "@prisma/client";
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
 
// IMPORTANT: this must be registered BEFORE "/tasks/:id" below,
// otherwise Express would treat "my-tasks" as an ":id" value.
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
 
router.post(
  "/tasks/:id/subtasks",
  auth(Role.OWNER, Role.MEMBER),
  validateRequest(TaskValidation.createSubtaskZodSchema),
  TaskController.createSubtask,
);
 
router.patch("/subtasks/:subtaskId", auth(Role.OWNER, Role.MEMBER), TaskController.toggleSubtask);
 
router.post(
  "/tasks/:id/comments",
  auth(Role.OWNER, Role.MEMBER),
  validateRequest(TaskValidation.createCommentZodSchema),
  TaskController.createComment,
);
 
router.get("/tasks/:id/comments", auth(Role.ADMIN, Role.OWNER, Role.MEMBER), TaskController.getComments);
 
export const TaskRoutes = router;
