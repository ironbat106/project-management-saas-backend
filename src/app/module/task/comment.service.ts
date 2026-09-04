import httpStatus from "http-status";
import { buildPaginationOptions, type IQuery } from "../../interfaces/index.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { AppError } from "../../utils/AppError.js";
import { logActivity } from "../../utils/activityLog.js";
import { assertOrganizationAccess } from "../../utils/orgAccess.js";
import { TaskService } from "./task.service.js";
 
const createComment = async (taskId: string, content: string, user: RequestUser) => {
  const task = await TaskService.getTaskOrThrow(taskId);
 
  await assertOrganizationAccess(task.project.organizationId, user);
 
  const comment = await prisma.comment.create({
    data: { taskId, content, authorId: user.userId },
    include: { author: { select: { id: true, name: true } } },
  });
 
  await logActivity({
    organizationId: task.project.organizationId,
    userId: user.userId,
    action: "COMMENT_ADDED",
    entityType: "TASK",
    entityId: taskId,
    metadata: { commentId: comment.id },
  });
 
  return comment;
};
 
const getComments = async (taskId: string, query: IQuery, user: RequestUser) => {
  const task = await TaskService.getTaskOrThrow(taskId);
 
  await assertOrganizationAccess(task.project.organizationId, user);
 
  const { page, limit, skip } = buildPaginationOptions(query);
 
  const where = { taskId, isDeleted: false };
 
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, name: true } } },
    }),
    prisma.comment.count({ where }),
  ]);
 
  return { data: comments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
 
export const CommentService = {
  createComment,
  getComments,
};
