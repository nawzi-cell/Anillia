import { prisma } from "@/lib/db/prisma";

export interface AuditInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: unknown;
  ip?: string | null;
}

/**
 * Record an admin action. Fire-and-forget safe: internal errors are
 * swallowed so auditing can never break the primary operation.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    // JSON round-trip strips `undefined` values, which Prisma rejects
    // inside Json fields.
    const metadata =
      input.metadata === undefined
        ? undefined
        : (JSON.parse(JSON.stringify(input.metadata)) as object);
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata,
        ip: input.ip ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}
