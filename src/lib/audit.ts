import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

export async function audit(
  user: SessionUser,
  action: string,
  entity: string,
  entityId: string,
  summary: string,
  extra?: { oldValue?: string; newValue?: string },
) {
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action,
      entity,
      entityId,
      summary,
      oldValue: extra?.oldValue,
      newValue: extra?.newValue,
    },
  });
}
