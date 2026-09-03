import httpStatus from "http-status";
import { Role } from "../../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import type { RequestUser } from "../middleware/checkAuth.js";
import { AppError } from "./AppError.js";
 

export const getActiveOrganizationOrThrow = async (organizationId: string) => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
 
  if (!organization || organization.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Organization not found");
  }
 
  return organization;
};

export const assertOrganizationAccess = async (organizationId: string, user: RequestUser) => {
  if (user.role === Role.ADMIN) {
    return "ADMIN" as const;
  }
 
  const organization = await getActiveOrganizationOrThrow(organizationId);
 
  if (organization.ownerId === user.userId) {
    return "OWNER" as const;
  }
 
  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId, userId: user.userId, isDeleted: false },
  });
 
  if (!membership) {
    throw new AppError(httpStatus.FORBIDDEN, "You do not have access to this organization");
  }
 
  return "MEMBER" as const;
};

export const assertOrganizationOwnership = async (organizationId: string, user: RequestUser) => {
  if (user.role === Role.ADMIN) {
    return;
  }
 
  const organization = await getActiveOrganizationOrThrow(organizationId);
 
  if (organization.ownerId !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Only the organization owner can perform this action");
  }
};
