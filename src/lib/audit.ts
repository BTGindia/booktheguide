import prisma from '@/lib/prisma';

/**
 * Log a change to a platform-owned field.
 * Every verification status, KYC, suspension, or certification review change is logged.
 */
export async function createAuditLog(params: {
  guideId?: string;
  entityType: string;  // "GuideProfile", "GuideCertification", "GuideKyc", "Product"
  entityId: string;
  action: string;      // "VERIFY", "SUSPEND", "REJECT", "APPROVE", "UPDATE_KYC", etc.
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  performedById: string;
  performedByName?: string;
}) {
  return prisma.auditLog.create({
    data: {
      guideId: params.guideId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      fieldName: params.fieldName,
      oldValue: params.oldValue,
      newValue: params.newValue,
      reason: params.reason,
      performedById: params.performedById,
      performedByName: params.performedByName,
    },
  });
}

/**
 * Store a version of critical data before overwriting.
 * Used for bio, package description, pricing — dispute resolution.
 */
export async function createDataVersion(params: {
  entityType: string;
  entityId: string;
  guideId?: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedById: string;
  changeReason?: string;
}) {
  return prisma.dataVersion.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      guideId: params.guideId,
      fieldName: params.fieldName,
      oldValue: params.oldValue,
      newValue: params.newValue,
      changedById: params.changedById,
      changeReason: params.changeReason,
    },
  });
}

/**
 * Version multiple fields at once (e.g. when a guide updates their profile)
 */
export async function versionFields(params: {
  entityType: string;
  entityId: string;
  guideId?: string;
  changedById: string;
  changes: { fieldName: string; oldValue: string | null; newValue: string | null }[];
}) {
  const versions = params.changes
    .filter(c => c.oldValue !== c.newValue) // Only version actual changes
    .map(c => ({
      entityType: params.entityType,
      entityId: params.entityId,
      guideId: params.guideId,
      fieldName: c.fieldName,
      oldValue: c.oldValue,
      newValue: c.newValue,
      changedById: params.changedById,
    }));

  if (versions.length === 0) return [];

  return prisma.dataVersion.createMany({ data: versions });
}
