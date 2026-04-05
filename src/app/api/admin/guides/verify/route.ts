import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { verificationActionSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// Helper: check admin role
async function requireAdmin(session: any) {
  if (!session) return null;
  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'GUIDE_MANAGER') return null;
  return { userId: (session.user as any).id, name: session.user.name || 'Admin', role };
}

// GET /api/admin/guides/verify â€” List guides by verification status
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const admin = await requireAdmin(session);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.verificationStatus = status;
    }
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const guides = await prisma.guideProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        slug: true,
        legalName: true,
        displayName: true,
        verificationStatus: true,
        profileCompleteness: true,
        isActive: true,
        pendingReviewFields: true,
        createdAt: true,
        user: { select: { name: true, email: true, image: true } },
        serviceAreas: { include: { state: { select: { name: true } } } },
        _count: { select: { guideCertifications: true } },
      },
    });

    return NextResponse.json({ guides });
  } catch (error) {
    console.error('Error listing guides for verification:', error);
    return NextResponse.json({ error: 'Failed to load guides' }, { status: 500 });
  }
}

// POST /api/admin/guides/verify â€” Change guide verification status
// SEPARATE WRITE PATH: Only admin can write to verification status
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const admin = await requireAdmin(session);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = verificationActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors[0]?.message || 'Validation failed',
      }, { status: 400 });
    }

    const { guideId, action, reason } = validation.data;

    const guide = await prisma.guideProfile.findUnique({
      where: { id: guideId },
      select: { id: true, verificationStatus: true, userId: true },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    const statusMap: Record<string, string> = {
      VERIFY: 'VERIFIED',
      SUSPEND: 'SUSPENDED',
      REJECT: 'UNVERIFIED',
      REVERT_TO_REVIEW: 'IN_REVIEW',
    };

    const newStatus = statusMap[action];
    const oldStatus = guide.verificationStatus;

    // Update verification status (platform-owned field)
    await prisma.guideProfile.update({
      where: { id: guideId },
      data: {
        verificationStatus: newStatus as any,
        isVerified: newStatus === 'VERIFIED',
        verifiedAt: newStatus === 'VERIFIED' ? new Date() : undefined,
        verifiedById: admin.userId,
        verificationNote: reason,
      },
    });

    // Audit log every change to platform-owned fields
    await createAuditLog({
      guideId,
      entityType: 'GuideProfile',
      entityId: guideId,
      action: `VERIFICATION_${action}`,
      fieldName: 'verificationStatus',
      oldValue: oldStatus,
      newValue: newStatus,
      reason,
      performedById: admin.userId,
      performedByName: admin.name,
    });

    return NextResponse.json({
      message: `Guide ${action.toLowerCase()} successfully`,
      newStatus,
    });
  } catch (error) {
    console.error('Error verifying guide:', error);
    return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
  }
}
