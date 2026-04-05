import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { certificationReviewSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

// Helper: check admin role
async function requireAdmin(session: any) {
  if (!session) return null;
  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'GUIDE_MANAGER') return null;
  return { userId: (session.user as any).id, name: session.user.name || 'Admin', role };
}

// POST /api/admin/certifications/review â€” Review a certification
// SEPARATE WRITE PATH: Only admin can write to certification verification status
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const admin = await requireAdmin(session);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = certificationReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors[0]?.message || 'Validation failed',
      }, { status: 400 });
    }

    const { certificationId, action, reason } = validation.data;

    const cert = await prisma.guideCertification.findUnique({
      where: { id: certificationId },
      select: { id: true, guideId: true, verificationStatus: true, certType: true },
    });

    if (!cert) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    const newStatus = action === 'VERIFY' ? 'VERIFIED' : 'REJECTED';
    const oldStatus = cert.verificationStatus;

    await prisma.guideCertification.update({
      where: { id: certificationId },
      data: {
        verificationStatus: newStatus as any,
        verifiedById: admin.userId,
        verifiedAt: new Date(),
        rejectionReason: action === 'REJECT' ? (reason || null) : null,
      },
    });

    // Audit log
    await createAuditLog({
      guideId: cert.guideId,
      entityType: 'GuideCertification',
      entityId: certificationId,
      action: `CERTIFICATION_${action}`,
      fieldName: 'verificationStatus',
      oldValue: oldStatus,
      newValue: newStatus,
      reason: reason || `${cert.certType} ${action.toLowerCase()}`,
      performedById: admin.userId,
      performedByName: admin.name,
    });

    return NextResponse.json({
      message: `Certification ${action.toLowerCase()} successfully`,
      newStatus,
    });
  } catch (error) {
    console.error('Error reviewing certification:', error);
    return NextResponse.json({ error: 'Failed to review certification' }, { status: 500 });
  }
}

// GET /api/admin/certifications/review â€” List pending certifications for review
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const admin = await requireAdmin(session);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const certifications = await prisma.guideCertification.findMany({
      where: { verificationStatus: status as any },
      include: {
        guide: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            user: { select: { name: true, email: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // Oldest first (FIFO review)
    });

    return NextResponse.json({ certifications });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }
}
