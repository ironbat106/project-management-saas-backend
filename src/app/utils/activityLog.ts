import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
 
interface ILogActivityPayload {
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: object;
}

export const logActivity = async (payload: ILogActivityPayload) => {
  try {
    await prisma.activityLog.create({
      data: {
        organizationId: payload.organizationId,
        userId: payload.userId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: (payload.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
};