import httpStatus from "http-status";
import { SprintStatus } from "@prisma/client";
import { buildPaginationOptions, type IQuery } from "../../interfaces/index.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { AppError } from "../../utils/AppError.js";
import { logActivity } from "../../utils/activityLog.js";
import { assertOrganizationAccess, assertOrganizationOwnership } from "../../utils/orgAccess.js";
import type { ICreateSprintPayload } from "./sprint.interface.js";
 
const getProjectOrThrow = async (projectId: string) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
 
  if (!project || project.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Project not found");
  }
 
  return project;
};
 
const createSprint = async (projectId: string, payload: ICreateSprintPayload, user: RequestUser) => {
  const project = await getProjectOrThrow(projectId);
 
  await assertOrganizationOwnership(project.organizationId, user);
 
  const existingSprint = await prisma.sprint.findFirst({
    where: { projectId, name: payload.name, isDeleted: false },
  });
 
  if (existingSprint) {
    throw new AppError(httpStatus.CONFLICT, "A sprint with this name already exists in this project");
  }
 
  const sprint = await prisma.sprint.create({
    data: {
      projectId,
      name: payload.name,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
    },
  });
 
  await logActivity({
    organizationId: project.organizationId,
    userId: user.userId,
    action: "SPRINT_CREATED",
    entityType: "SPRINT",
    entityId: sprint.id,
  });
 
  return sprint;
};
 
const getSprints = async (projectId: string, query: IQuery, user: RequestUser) => {
  const project = await getProjectOrThrow(projectId);
 
  await assertOrganizationAccess(project.organizationId, user);
 
  const { page, limit, skip, sortBy, sortOrder } = buildPaginationOptions(query);
 
  const where = { projectId, isDeleted: false };
 
  const [sprints, total] = await Promise.all([
    prisma.sprint.findMany({
      where,
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.sprint.count({ where }),
  ]);
 
  return {
    data: sprints,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const SPRINT_STATUS_TRANSITIONS: Record<SprintStatus, SprintStatus[]> = {
  PLANNED: [SprintStatus.ACTIVE],
  ACTIVE: [SprintStatus.COMPLETED],
  COMPLETED: [],
};

const updateSprintStatus = async (sprintId: string, newStatus: SprintStatus, user: RequestUser) => {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
 
  if (!sprint || sprint.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Sprint not found");
  }
 
  const project = await getProjectOrThrow(sprint.projectId);
 
  await assertOrganizationOwnership(project.organizationId, user);
 
  const allowedNextStatuses = SPRINT_STATUS_TRANSITIONS[sprint.status];
 
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot move a sprint from ${sprint.status} to ${newStatus}. Allowed next status(es): ${
        allowedNextStatuses.join(", ") || "none (this is a final state)"
      }`,
    );
  }
 
  const updatedSprint = await prisma.$transaction(async (tx) => {
    if (newStatus === SprintStatus.ACTIVE) {
      const alreadyActiveSprint = await tx.sprint.findFirst({
        where: { projectId: sprint.projectId, status: SprintStatus.ACTIVE, isDeleted: false },
      });
 
      if (alreadyActiveSprint) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Project already has an active sprint ("${alreadyActiveSprint.name}"). Complete it before starting a new one.`,
        );
      }
    }
 
    return tx.sprint.update({
      where: { id: sprintId },
      data: { status: newStatus },
    });
  });
 
  await logActivity({
    organizationId: project.organizationId,
    userId: user.userId,
    action: "SPRINT_STATUS_CHANGED",
    entityType: "SPRINT",
    entityId: sprintId,
    metadata: { from: sprint.status, to: newStatus },
  });
 
  return updatedSprint;
};
 
export const SprintService = {
  createSprint,
  getSprints,
  updateSprintStatus,
};
