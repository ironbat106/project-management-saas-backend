import { redisClient } from "../../lib/redis.js";
import { prisma } from "../../lib/prisma.js";
import type { RequestUser } from "../../middleware/checkAuth.js";
import { assertOrganizationAccess } from "../../utils/orgAccess.js";
 
const CACHE_TTL_SECONDS = 60;
 
// Dashboard stats are read very often (every time the OWNER opens their
// dashboard) but change relatively slowly, so they are a perfect fit
// for a short-lived Redis cache. This keeps repeated reads fast and
// takes real load off PostgreSQL without ever risking stale billing or
// task data (only these aggregate counters are cached).
const getDashboardStats = async (organizationId: string, user: RequestUser) => {
  await assertOrganizationAccess(organizationId, user);
 
  const cacheKey = `org-dashboard-stats:${organizationId}`;
 
  const cached = await redisClient.get(cacheKey).catch(() => null);
 
  if (cached) {
    return { ...JSON.parse(cached), fromCache: true };
  }
 
  const [totalMembers, totalTeams, totalProjects, tasksByStatus] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId, isDeleted: false } }),
    prisma.team.count({ where: { organizationId, isDeleted: false } }),
    prisma.project.count({ where: { organizationId, isDeleted: false } }),
    prisma.task.groupBy({
      by: ["status"],
      where: { project: { organizationId }, isDeleted: false },
      _count: { _all: true },
    }),
  ]);
 
  const stats = {
    totalMembers,
    totalTeams,
    totalProjects,
    tasksByStatus: tasksByStatus.map((row) => ({ status: row.status, count: row._count._all })),
  };
 
  await redisClient.set(cacheKey, JSON.stringify(stats), { EX: CACHE_TTL_SECONDS }).catch(() => null);
 
  return { ...stats, fromCache: false };
};
 
export const OrganizationStatsService = {
  getDashboardStats,
};
