import httpStatus from "http-status";
import { buildPaginationOptions, type IQuery } from "../../interfaces/index.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { AppError } from "../../utils/AppError.js";
import { logActivity } from "../../utils/activityLog.js";
import { assertOrganizationAccess, assertOrganizationOwnership } from "../../utils/orgAccess.js";
import type { ICreateTeamPayload } from "./team.interface.js";
 
const createTeam = async (organizationId: string, payload: ICreateTeamPayload, user: RequestUser) => {
  await assertOrganizationOwnership(organizationId, user);
 
  const existingTeam = await prisma.team.findFirst({
    where: { organizationId, name: payload.name, isDeleted: false },
  });
 
  if (existingTeam) {
    throw new AppError(httpStatus.CONFLICT, "A team with this name already exists in this organization");
  }
 
  const team = await prisma.team.create({
    data: { organizationId, name: payload.name },
  });
 
  await logActivity({
    organizationId,
    userId: user.userId,
    action: "TEAM_CREATED",
    entityType: "TEAM",
    entityId: team.id,
  });
 
  return team;
};
 
const getTeams = async (organizationId: string, query: IQuery, user: RequestUser) => {
  await assertOrganizationAccess(organizationId, user);
 
  const { page, limit, skip, sortBy, sortOrder } = buildPaginationOptions(query);
 
  const where = { organizationId, isDeleted: false };
 
  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: { _count: { select: { members: true, projects: true } } },
    }),
    prisma.team.count({ where }),
  ]);
 
  return {
    data: teams,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};
 
const getTeamOrThrow = async (teamId: string) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
 
  if (!team || team.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "Team not found");
  }
 
  return team;
};
 
// Only an existing organization member can be added to one of its teams,
// which guarantees a team never contains an outsider.
const addTeamMember = async (teamId: string, targetUserId: string, user: RequestUser) => {
  const team = await getTeamOrThrow(teamId);
 
  await assertOrganizationOwnership(team.organizationId, user);
 
  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId: team.organizationId, userId: targetUserId, isDeleted: false },
  });
 
  if (!membership) {
    throw new AppError(httpStatus.BAD_REQUEST, "This user is not a member of the organization yet");
  }
 
  const existingTeamMember = await prisma.teamMember.findUnique({
    where: { unique_team_member: { teamId, userId: targetUserId } },
  });
 
  if (existingTeamMember) {
    throw new AppError(httpStatus.CONFLICT, "This user is already part of the team");
  }
 
  const teamMember = await prisma.teamMember.create({
    data: { teamId, userId: targetUserId },
  });
 
  await logActivity({
    organizationId: team.organizationId,
    userId: user.userId,
    action: "TEAM_MEMBER_ADDED",
    entityType: "TEAM",
    entityId: teamId,
    metadata: { addedUserId: targetUserId },
  });
 
  return teamMember;
};
 
const removeTeamMember = async (teamId: string, targetUserId: string, user: RequestUser) => {
  const team = await getTeamOrThrow(teamId);
 
  await assertOrganizationOwnership(team.organizationId, user);
 
  const teamMember = await prisma.teamMember.findUnique({
    where: { unique_team_member: { teamId, userId: targetUserId } },
  });
 
  if (!teamMember) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not part of the team");
  }
 
  await prisma.teamMember.delete({ where: { id: teamMember.id } });
 
  await logActivity({
    organizationId: team.organizationId,
    userId: user.userId,
    action: "TEAM_MEMBER_REMOVED",
    entityType: "TEAM",
    entityId: teamId,
    metadata: { removedUserId: targetUserId },
  });
 
  return null;
};
 
export const TeamService = {
  createTeam,
  getTeams,
  addTeamMember,
  removeTeamMember,
};
