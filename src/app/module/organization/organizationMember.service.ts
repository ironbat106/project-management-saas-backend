import bcrypt from "bcryptjs";
import crypto from "crypto";
import httpStatus from "http-status";
import config from "../../config/index.js";
import { Role } from "../../../generated/prisma/index.js";
import type { IQuery } from "../../interfaces/index.js";
import { buildPaginationOptions } from "../../interfaces/index.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { AppError } from "../../utils/AppError.js";
import { logActivity } from "../../utils/activityLog.js";
import { assertOrganizationAccess, assertOrganizationOwnership } from "../../utils/orgAccess.js";
import type { IInviteMemberPayload } from "./organization.interface.js";

const inviteMember = async (organizationId: string, payload: IInviteMemberPayload, user: RequestUser) => {
  await assertOrganizationOwnership(organizationId, user);
 
  const email = payload.email.trim().toLowerCase();
 
  let invitedUser = await prisma.user.findUnique({ where: { email } });
  let temporaryPassword: string | null = null;
 
  if (invitedUser) {
    if (invitedUser.role !== Role.MEMBER) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This email already has a ${invitedUser.role} account and cannot be invited as a member`,
      );
    }
 
    if (invitedUser.isDeleted || invitedUser.status !== "ACTIVE") {
      throw new AppError(httpStatus.BAD_REQUEST, "This user's account is not active");
    }
  } else {
    temporaryPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(temporaryPassword, Number(config.bcrypt_salt_rounds));
 
    invitedUser = await prisma.user.create({
      data: {
        name: payload.name,
        email,
        password: hashedPassword,
        role: Role.MEMBER,
        needPasswordChange: true,
      },
    });
  }
 
  const existingMembership = await prisma.organizationMember.findUnique({
    where: { unique_organization_member: { organizationId, userId: invitedUser.id } },
  });
 
  if (existingMembership && !existingMembership.isDeleted) {
    throw new AppError(httpStatus.CONFLICT, "This user is already a member of this organization");
  }
 
  const membership = existingMembership
    ? await prisma.organizationMember.update({
        where: { id: existingMembership.id },
        data: { isDeleted: false, deletedAt: null, joinedAt: new Date() },
      })
    : await prisma.organizationMember.create({
        data: { organizationId, userId: invitedUser.id },
      });
 
  await logActivity({
    organizationId,
    userId: user.userId,
    action: "MEMBER_INVITED",
    entityType: "ORGANIZATION_MEMBER",
    entityId: membership.id,
    metadata: { invitedEmail: email },
  });
 
  return {
    membership,
    invitedUser: { id: invitedUser.id, name: invitedUser.name, email: invitedUser.email },
    // only present the first time a brand new account is created
    temporaryPassword,
  };
};
 
const getMembers = async (organizationId: string, query: IQuery, user: RequestUser) => {
  await assertOrganizationAccess(organizationId, user);
 
  const { page, limit, skip, sortBy, sortOrder } = buildPaginationOptions(query);
 
  const [members, total] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId, isDeleted: false },
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: { user: { select: { id: true, name: true, email: true, role: true, status: true } } },
    }),
    prisma.organizationMember.count({ where: { organizationId, isDeleted: false } }),
  ]);
 
  return {
    data: members,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};
 
const removeMember = async (organizationId: string, memberId: string, user: RequestUser) => {
  await assertOrganizationOwnership(organizationId, user);
 
  const membership = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId, isDeleted: false },
  });
 
  if (!membership) {
    throw new AppError(httpStatus.NOT_FOUND, "Membership not found");
  }
 
  await prisma.organizationMember.update({
    where: { id: membership.id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
 
  await logActivity({
    organizationId,
    userId: user.userId,
    action: "MEMBER_REMOVED",
    entityType: "ORGANIZATION_MEMBER",
    entityId: membership.id,
  });
 
  return null;
};
 
export const OrganizationMemberService = {
  inviteMember,
  getMembers,
  removeMember,
};
