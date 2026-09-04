import httpStatus from "http-status";
import { Prisma, Role, SubscriptionPlan, SubscriptionStatus } from "../../../generated/prisma/index.js";
import type { IQuery } from "../../interfaces/index.js";
import { buildPaginationOptions } from "../../interfaces/index.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { AppError } from "../../utils/AppError.js";
import { logActivity } from "../../utils/activityLog.js";
import { assertOrganizationAccess, getActiveOrganizationOrThrow } from "../../utils/orgAccess.js";
import type { ICreateOrganizationPayload, IUpdateOrganizationPayload } from "./organization.interface.js";

const generateUniqueSlug = async (name: string) => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
 
  let slug = baseSlug;
  let suffix = 1;
 
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
 
  return slug;
};
 

const createOrganization = async (payload: ICreateOrganizationPayload, user: RequestUser) => {
  const slug = await generateUniqueSlug(payload.name);
 
  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: payload.name,
        description: payload.description,
        slug,
        ownerId: user.userId,
      },
    });
 
    await tx.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: user.userId,
      },
    });
 
    return org;
  });
 
  await logActivity({
    organizationId: organization.id,
    userId: user.userId,
    action: "ORGANIZATION_CREATED",
    entityType: "ORGANIZATION",
    entityId: organization.id,
  });
 
  return organization;
};
 
const getOrganizations = async (query: IQuery, user: RequestUser) => {
  const { page, limit, skip, sortBy, sortOrder } = buildPaginationOptions(query);
 
  const andConditions: Prisma.OrganizationWhereInput[] = [{ isDeleted: false }];
 

  if (user.role === Role.OWNER) {
    andConditions.push({ ownerId: user.userId });
  } else if (user.role === Role.MEMBER) {
    andConditions.push({ members: { some: { userId: user.userId, isDeleted: false } } });
  }
 
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: String(query.searchTerm), mode: "insensitive" } },
        { slug: { contains: String(query.searchTerm), mode: "insensitive" } },
      ],
    });
  }
 
  if (query.subscriptionPlan) {
    andConditions.push({ subscriptionPlan: query.subscriptionPlan as SubscriptionPlan });
  }
 
  if (query.subscriptionStatus) {
    andConditions.push({ subscriptionStatus: query.subscriptionStatus as SubscriptionStatus });
  }
 
  const where: Prisma.OrganizationWhereInput = { AND: andConditions };
 
  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, projects: true, teams: true } },
      },
    }),
    prisma.organization.count({ where }),
  ]);
 
  return {
    data: organizations,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};
 
const getSingleOrganization = async (organizationId: string, user: RequestUser) => {
  await assertOrganizationAccess(organizationId, user);
 
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true, projects: true, teams: true } },
    },
  });
 
  if (!organization || organization.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Organization not found");
  }
 
  return organization;
};
 
const updateOrganization = async (organizationId: string, payload: IUpdateOrganizationPayload, user: RequestUser) => {
  const organization = await getActiveOrganizationOrThrow(organizationId);
 
  if (user.role !== Role.ADMIN && organization.ownerId !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the organization owner can update this organization");
  }
 
  const updatedOrganization = await prisma.organization.update({
    where: { id: organizationId },
    data: payload,
  });
 
  await logActivity({
    organizationId,
    userId: user.userId,
    action: "ORGANIZATION_UPDATED",
    entityType: "ORGANIZATION",
    entityId: organizationId,
    metadata: payload,
  });
 
  return updatedOrganization;
};

const deleteOrganization = async (organizationId: string, user: RequestUser) => {
  const organization = await getActiveOrganizationOrThrow(organizationId);
 
  if (user.role !== Role.ADMIN && organization.ownerId !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the organization owner can delete this organization");
  }
 
  await prisma.$transaction(async (tx) => {
    const now = new Date();
 
    await tx.organization.update({
      where: { id: organizationId },
      data: { isDeleted: true, deletedAt: now },
    });
 
    await tx.project.updateMany({
      where: { organizationId },
      data: { isDeleted: true, deletedAt: now },
    });
 
    await tx.task.updateMany({
      where: { project: { organizationId } },
      data: { isDeleted: true, deletedAt: now },
    });
  });
 
  await logActivity({
    organizationId,
    userId: user.userId,
    action: "ORGANIZATION_DELETED",
    entityType: "ORGANIZATION",
    entityId: organizationId,
  });
 
  return null;
};
 
export const OrganizationService = {
  createOrganization,
  getOrganizations,
  getSingleOrganization,
  updateOrganization,
  deleteOrganization,
};
