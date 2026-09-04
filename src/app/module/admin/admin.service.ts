import httpStatus from "http-status";
import { Prisma, Role, SubscriptionPlan, UserStatus } from "../../../generated/prisma/index.js";
import { buildPaginationOptions, type IQuery } from "../../interfaces/index.js";
import { redisClient } from "../../lib/redis.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
 
const getUsers = async (query: IQuery) => {
  const { page, limit, skip, sortBy, sortOrder } = buildPaginationOptions(query);
 
  const andConditions: Prisma.UserWhereInput[] = [{ isDeleted: false }];
 
  if (query.role) andConditions.push({ role: query.role as Role });
  if (query.status) andConditions.push({ status: query.status as UserStatus });
 
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: String(query.searchTerm), mode: "insensitive" } },
        { email: { contains: String(query.searchTerm), mode: "insensitive" } },
      ],
    });
  }
 
  const where: Prisma.UserWhereInput = { AND: andConditions };
 
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      omit: { password: true },
    }),
    prisma.user.count({ where }),
  ]);
 
  return { data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
 
const updateUserStatus = async (userId: string, status: "ACTIVE" | "BLOCKED") => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
 
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
 
  if (user.role === Role.ADMIN) {
    throw new AppError(httpStatus.FORBIDDEN, "An admin account's status cannot be changed this way");
  }
 
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: status as UserStatus },
    omit: { password: true },
  });
 
  return updatedUser;
};
 
const getOrganizations = async (query: IQuery) => {
  const { page, limit, skip, sortBy, sortOrder } = buildPaginationOptions(query);
 
  const andConditions: Prisma.OrganizationWhereInput[] = [{ isDeleted: false }];
 
  if (query.subscriptionPlan) {
    andConditions.push({ subscriptionPlan: query.subscriptionPlan as SubscriptionPlan });
  }
 
  if (query.searchTerm) {
    andConditions.push({ name: { contains: String(query.searchTerm), mode: "insensitive" } });
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
        _count: { select: { members: true, projects: true } },
      },
    }),
    prisma.organization.count({ where }),
  ]);
 
  return { data: organizations, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
 
const getAuditLogs = async (query: IQuery) => {
  const { page, limit, skip } = buildPaginationOptions(query);
 
  const andConditions: Prisma.ActivityLogWhereInput[] = [];
 
  if (query.organizationId) andConditions.push({ organizationId: String(query.organizationId) });
  if (query.entityType) andConditions.push({ entityType: String(query.entityType) });
 
  const where: Prisma.ActivityLogWhereInput = andConditions.length ? { AND: andConditions } : {};
 
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);
 
  return { data: logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
 
// Same short-lived Redis caching strategy used for org-level dashboard
// stats — platform stats are read constantly on the admin dashboard but
// don't need to be perfectly real-time.
const getPlatformStats = async () => {
  const cacheKey = "admin-platform-stats";
 
  const cached = await redisClient.get(cacheKey).catch(() => null);
  if (cached) {
    return { ...JSON.parse(cached), fromCache: true };
  }
 
  const [totalUsers, totalOrganizations, totalProjects, totalTasks, paidOrganizations] = await Promise.all([
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.organization.count({ where: { isDeleted: false } }),
    prisma.project.count({ where: { isDeleted: false } }),
    prisma.task.count({ where: { isDeleted: false } }),
    prisma.organization.count({ where: { isDeleted: false, subscriptionPlan: { not: "FREE" } } }),
  ]);
 
  const stats = { totalUsers, totalOrganizations, totalProjects, totalTasks, paidOrganizations };
 
  await redisClient.set(cacheKey, JSON.stringify(stats), { EX: 60 }).catch(() => null);
 
  return { ...stats, fromCache: false };
};
 
export const AdminService = {
  getUsers,
  updateUserStatus,
  getOrganizations,
  getAuditLogs,
  getPlatformStats,
};
