import httpStatus from "http-status";
import { Prisma, ProjectStatus } from "../../../generated/prisma/index.js";
import { buildPaginationOptions, type IQuery } from "../../interfaces/index.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { AppError } from "../../utils/AppError.js";
import { logActivity } from "../../utils/activityLog.js";
import { assertOrganizationAccess, assertOrganizationOwnership } from "../../utils/orgAccess.js";
import type { ICreateProjectPayload, IUpdateProjectPayload } from "./project.interface.js";
 
const createProject = async (organizationId: string, payload: ICreateProjectPayload, user: RequestUser) => {
  await assertOrganizationOwnership(organizationId, user);
 
  if (payload.teamId) {
    const team = await prisma.team.findFirst({
      where: { id: payload.teamId, organizationId, isDeleted: false },
    });
 
    if (!team) {
      throw new AppError(httpStatus.BAD_REQUEST, "This team does not belong to this organization");
    }
  }
 
  const project = await prisma.project.create({
    data: {
      organizationId,
      name: payload.name,
      description: payload.description,
      teamId: payload.teamId,
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
    },
  });
 
  await logActivity({
    organizationId,
    userId: user.userId,
    action: "PROJECT_CREATED",
    entityType: "PROJECT",
    entityId: project.id,
  });
 
  return project;
};
 
const getProjects = async (organizationId: string, query: IQuery, user: RequestUser) => {
  await assertOrganizationAccess(organizationId, user);
 
  const { page, limit, skip, sortBy, sortOrder } = buildPaginationOptions(query);
 
  const andConditions: Prisma.ProjectWhereInput[] = [{ organizationId, isDeleted: false }];
 
  if (query.status) {
    andConditions.push({ status: query.status as ProjectStatus });
  }
 
  if (query.teamId) {
    andConditions.push({ teamId: String(query.teamId) });
  }
 
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: String(query.searchTerm), mode: "insensitive" } },
        { description: { contains: String(query.searchTerm), mode: "insensitive" } },
      ],
    });
  }
 
  const where: Prisma.ProjectWhereInput = { AND: andConditions };
 
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: { team: { select: { id: true, name: true } }, _count: { select: { tasks: true, sprints: true } } },
    }),
    prisma.project.count({ where }),
  ]);
 
  return {
    data: projects,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};
 
const getProjectOrThrow = async (projectId: string) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
 
  if (!project || project.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Project not found");
  }
 
  return project;
};
 
const getSingleProject = async (projectId: string, user: RequestUser) => {
  const project = await getProjectOrThrow(projectId);
 
  await assertOrganizationAccess(project.organizationId, user);
 
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: { select: { id: true, name: true } },
      _count: { select: { tasks: true, sprints: true } },
    },
  });
};
 
const updateProject = async (projectId: string, payload: IUpdateProjectPayload, user: RequestUser) => {
  const project = await getProjectOrThrow(projectId);
 
  await assertOrganizationOwnership(project.organizationId, user);
 
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      name: payload.name,
      description: payload.description,
      teamId: payload.teamId,
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
    },
  });
 
  await logActivity({
    organizationId: project.organizationId,
    userId: user.userId,
    action: "PROJECT_UPDATED",
    entityType: "PROJECT",
    entityId: projectId,
    metadata: payload,
  });
 
  return updatedProject;
};
 
// A project's lifecycle only ever moves forward:
// ACTIVE -> COMPLETED -> ARCHIVED, or ACTIVE -> ARCHIVED directly.
// ARCHIVED is a terminal state and can never change again.
const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  ACTIVE: [ProjectStatus.COMPLETED, ProjectStatus.ARCHIVED],
  COMPLETED: [ProjectStatus.ARCHIVED],
  ARCHIVED: [],
};
 
const updateProjectStatus = async (projectId: string, newStatus: ProjectStatus, user: RequestUser) => {
  const project = await getProjectOrThrow(projectId);
 
  await assertOrganizationOwnership(project.organizationId, user);
 
  const allowedNextStatuses = PROJECT_STATUS_TRANSITIONS[project.status];
 
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot move a project from ${project.status} to ${newStatus}. Allowed next status(es): ${
        allowedNextStatuses.join(", ") || "none (this is a final state)"
      }`,
    );
  }
 
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: { status: newStatus },
  });
 
  await logActivity({
    organizationId: project.organizationId,
    userId: user.userId,
    action: "PROJECT_STATUS_CHANGED",
    entityType: "PROJECT",
    entityId: projectId,
    metadata: { from: project.status, to: newStatus },
  });
 
  return updatedProject;
};
 
const deleteProject = async (projectId: string, user: RequestUser) => {
  const project = await getProjectOrThrow(projectId);
 
  await assertOrganizationOwnership(project.organizationId, user);
 
  await prisma.$transaction(async (tx) => {
    const now = new Date();
 
    await tx.project.update({
      where: { id: projectId },
      data: { isDeleted: true, deletedAt: now },
    });
 
    await tx.task.updateMany({
      where: { projectId },
      data: { isDeleted: true, deletedAt: now },
    });
  });
 
  await logActivity({
    organizationId: project.organizationId,
    userId: user.userId,
    action: "PROJECT_DELETED",
    entityType: "PROJECT",
    entityId: projectId,
  });
 
  return null;
};
 
export const ProjectService = {
  createProject,
  getProjects,
  getSingleProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
};
