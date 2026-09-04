import httpStatus from "http-status";
import { Prisma, TaskPriority, TaskStatus } from "../../../generated/prisma/index.js";
import { buildPaginationOptions, type IQuery } from "../../interfaces/index.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { AppError } from "../../utils/AppError.js";
import { logActivity } from "../../utils/activityLog.js";
import { assertOrganizationAccess, assertOrganizationOwnership } from "../../utils/orgAccess.js";
import type { ICreateTaskPayload, IUpdateTaskPayload } from "./task.interface.js";
 
const getProjectOrThrow = async (projectId: string) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
 
  if (!project || project.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Project not found");
  }
 
  return project;
};
 

const assertUserBelongsToOrganization = async (organizationId: string, targetUserId: string) => {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
 
  if (organization?.ownerId === targetUserId) {
    return;
  }
 
  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId, userId: targetUserId, isDeleted: false },
  });
 
  if (!membership) {
    throw new AppError(httpStatus.BAD_REQUEST, "The selected user is not a member of this organization");
  }
};
 
const createTask = async (projectId: string, payload: ICreateTaskPayload, user: RequestUser) => {
  const project = await getProjectOrThrow(projectId);
 

  await assertOrganizationAccess(project.organizationId, user);
 
  if (payload.sprintId) {
    const sprint = await prisma.sprint.findFirst({ where: { id: payload.sprintId, projectId, isDeleted: false } });
    if (!sprint) {
      throw new AppError(httpStatus.BAD_REQUEST, "This sprint does not belong to this project");
    }
  }
 
  if (payload.assigneeId) {
    await assertUserBelongsToOrganization(project.organizationId, payload.assigneeId);
  }
 
  const task = await prisma.task.create({
    data: {
      projectId,
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      sprintId: payload.sprintId,
      assigneeId: payload.assigneeId,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      createdById: user.userId,
    },
  });
 
  await logActivity({
    organizationId: project.organizationId,
    userId: user.userId,
    action: "TASK_CREATED",
    entityType: "TASK",
    entityId: task.id,
  });
 
  return task;
};
 
const getTasks = async (projectId: string, query: IQuery, user: RequestUser) => {
  const project = await getProjectOrThrow(projectId);
 
  await assertOrganizationAccess(project.organizationId, user);
 
  const { page, limit, skip, sortBy, sortOrder } = buildPaginationOptions(query);
 
  const andConditions: Prisma.TaskWhereInput[] = [{ projectId, isDeleted: false }];
 
  if (query.status) andConditions.push({ status: query.status as TaskStatus });
  if (query.priority) andConditions.push({ priority: query.priority as TaskPriority });
  if (query.assigneeId) andConditions.push({ assigneeId: String(query.assigneeId) });
  if (query.sprintId) andConditions.push({ sprintId: String(query.sprintId) });
 
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: String(query.searchTerm), mode: "insensitive" } },
        { description: { contains: String(query.searchTerm), mode: "insensitive" } },
      ],
    });
  }
 
  const where: Prisma.TaskWhereInput = { AND: andConditions };
 
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        sprint: { select: { id: true, name: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);
 
  return { data: tasks, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
 

const getMyTasks = async (query: IQuery, user: RequestUser) => {
  const { page, limit, skip, sortBy, sortOrder } = buildPaginationOptions(query);
 
  const andConditions: Prisma.TaskWhereInput[] = [{ assigneeId: user.userId, isDeleted: false }];
 
  if (query.status) andConditions.push({ status: query.status as TaskStatus });
  if (query.priority) andConditions.push({ priority: query.priority as TaskPriority });
 
  const where: Prisma.TaskWhereInput = { AND: andConditions };
 
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        sprint: { select: { id: true, name: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);
 
  return { data: tasks, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
 
const getTaskOrThrow = async (taskId: string) => {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
 
  if (!task || task.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }
 
  return task;
};
 
const getSingleTask = async (taskId: string, user: RequestUser) => {
  const task = await getTaskOrThrow(taskId);
 
  await assertOrganizationAccess(task.project.organizationId, user);
 
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      sprint: { select: { id: true, name: true, status: true } },
      subtasks: { where: { isDeleted: false }, orderBy: { createdAt: "asc" } },
      comments: {
        where: { isDeleted: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
};
 
const updateTask = async (taskId: string, payload: IUpdateTaskPayload, user: RequestUser) => {
  const task = await getTaskOrThrow(taskId);
 
  await assertOrganizationAccess(task.project.organizationId, user);
 
  if (payload.sprintId) {
    const sprint = await prisma.sprint.findFirst({
      where: { id: payload.sprintId, projectId: task.projectId, isDeleted: false },
    });
    if (!sprint) {
      throw new AppError(httpStatus.BAD_REQUEST, "This sprint does not belong to this project");
    }
  }
 
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      sprintId: payload.sprintId,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    },
  });
 
  await logActivity({
    organizationId: task.project.organizationId,
    userId: user.userId,
    action: "TASK_UPDATED",
    entityType: "TASK",
    entityId: taskId,
    metadata: payload,
  });
 
  return updatedTask;
};
 

const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: [TaskStatus.IN_PROGRESS],
  IN_PROGRESS: [TaskStatus.IN_REVIEW, TaskStatus.TODO],
  IN_REVIEW: [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
  DONE: [TaskStatus.IN_PROGRESS],
};
 

const updateTaskStatus = async (taskId: string, newStatus: TaskStatus, user: RequestUser) => {
  const task = await getTaskOrThrow(taskId);
 
  const access = await assertOrganizationAccess(task.project.organizationId, user);
 
  if (access !== "ADMIN" && access !== "OWNER" && task.assigneeId !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the assignee or the organization owner can change this task's status");
  }
 
  const allowedNextStatuses = TASK_STATUS_TRANSITIONS[task.status];
 
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot move a task from ${task.status} to ${newStatus}. Allowed next status(es): ${allowedNextStatuses.join(", ")}`,
    );
  }
 
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });
 
  await logActivity({
    organizationId: task.project.organizationId,
    userId: user.userId,
    action: "TASK_STATUS_CHANGED",
    entityType: "TASK",
    entityId: taskId,
    metadata: { from: task.status, to: newStatus },
  });
 
  return updatedTask;
};
 
const assignTask = async (taskId: string, assigneeId: string, user: RequestUser) => {
  const task = await getTaskOrThrow(taskId);
 
  await assertOrganizationOwnership(task.project.organizationId, user);
 
  await assertUserBelongsToOrganization(task.project.organizationId, assigneeId);
 
  const updatedTask = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: taskId },
      data: { assigneeId },
    });
 
    return updated;
  });
 
  await logActivity({
    organizationId: task.project.organizationId,
    userId: user.userId,
    action: "TASK_ASSIGNED",
    entityType: "TASK",
    entityId: taskId,
    metadata: { assigneeId },
  });
 
  return updatedTask;
};
 
const deleteTask = async (taskId: string, user: RequestUser) => {
  const task = await getTaskOrThrow(taskId);
 
  const access = await assertOrganizationAccess(task.project.organizationId, user);
 
  if (access !== "ADMIN" && access !== "OWNER" && task.createdById !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the organization owner or the task creator can delete this task");
  }
 
  await prisma.task.update({
    where: { id: taskId },
    data: { isDeleted: true, deletedAt: new Date() },
  });
 
  await logActivity({
    organizationId: task.project.organizationId,
    userId: user.userId,
    action: "TASK_DELETED",
    entityType: "TASK",
    entityId: taskId,
  });
 
  return null;
};
 
export const TaskService = {
  createTask,
  getTasks,
  getMyTasks,
  getSingleTask,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
  getTaskOrThrow,
};
