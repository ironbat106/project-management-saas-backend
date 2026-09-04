import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { AppError } from "../../utils/AppError.js";
import { logActivity } from "../../utils/activityLog.js";
import { assertOrganizationAccess } from "../../utils/orgAccess.js";
import { TaskService } from "./task.service.js";
 
const createSubtask = async (taskId: string, title: string, user: RequestUser) => {
  const task = await TaskService.getTaskOrThrow(taskId);
 
  await assertOrganizationAccess(task.project.organizationId, user);
 
  const subtask = await prisma.subtask.create({
    data: { taskId, title },
  });
 
  await logActivity({
    organizationId: task.project.organizationId,
    userId: user.userId,
    action: "SUBTASK_CREATED",
    entityType: "SUBTASK",
    entityId: subtask.id,
    metadata: { taskId },
  });
 
  return subtask;
};

const toggleSubtask = async (subtaskId: string, user: RequestUser) => {
  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: { include: { project: true } } },
  });
 
  if (!subtask || subtask.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Subtask not found");
  }
 
  await assertOrganizationAccess(subtask.task.project.organizationId, user);
 
  const updatedSubtask = await prisma.subtask.update({
    where: { id: subtaskId },
    data: { isCompleted: !subtask.isCompleted },
  });
 
  await logActivity({
    organizationId: subtask.task.project.organizationId,
    userId: user.userId,
    action: "SUBTASK_TOGGLED",
    entityType: "SUBTASK",
    entityId: subtaskId,
    metadata: { isCompleted: updatedSubtask.isCompleted },
  });
 
  return updatedSubtask;
};
 
export const SubtaskService = {
  createSubtask,
  toggleSubtask,
};
