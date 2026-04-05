import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { kycReviewSchema } from '@/lib/validations';

// Helper: check admin role
async function requireAdmin(session: any) {
  if (!session) return null;
  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'GUIDE_MANAGER') return null;
  return { userId: (session.user as any).id, name: session.user.name || 'Admin', role };
}

// POST /api/admin/kyc/review — Review KYC submission
// SEPARATE WRITE PATH: Only admin can write to KYC status and payout eligibility
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const admin = await requireAdmin(session);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = kycReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors[0]?.message || 'Validation failed',
      }, { status: 400 });
    }

    const { guideId, action, reason, payoutEligible } = validation.data;

    const kyc = await prisma.guideKyc.findUnique({
      where: { guideId },
      select: { id: true, kycStatus: true },
    });

    if (!kyc) {
      return NextResponse.json({ error: 'KYC record not found' }, { status: 404 });
    }

    const newStatus = action === 'VERIFY' ? 'VERIFIED' : 'REJECTED';
    const oldStatus = kyc.kycStatus;

    // Determine payout eligibility
    // Guide can be live without KYC, but cannot receive payout without verified KYC
    const isPayoutEligible = action === 'VERIFY' ? (payoutEligible ?? true) : false;

    await prisma.guideKyc.update({
      where: { guideId },
      data: {
        kycStatus: newStatus as any,
        payoutEligible: isPayoutEligible,
        aadhaarVerified: action === 'VERIFY' ? true : undefined,
        panVerified: action === 'VERIFY' ? true : undefined,
        bankVerified: action === 'VERIFY' ? true : undefined,
        verifiedById: admin.userId,
        verifiedAt: new Date(),
        rejectionReason: action === 'REJECT' ? (reason || null) : null,
      },
    });

    // Audit log
    await createAuditLog({
      guideId,
      entityType: 'GuideKyc',
      entityId: kyc.id,
      action: `KYC_${action}`,
      fieldName: 'kycStatus',
      oldValue: oldStatus,
      newValue: newStatus,
      reason: reason || `KYC ${action.toLowerCase()}`,
      performedById: admin.userId,
      performedByName: admin.name,
    });

    return NextResponse.json({
      message: `KYC ${action.toLowerCase()} successfully`,
      newStatus,
      payoutEligible: isPayoutEligible,
    });
  } catch (error) {
    console.error('Error reviewing KYC:', error);
    return NextResponse.json({ error: 'Failed to review KYC' }, { status: 500 });
  }
}

// GET /api/admin/kyc/review — List pending KYC submissions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const admin = await requireAdmin(session);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const kycRecords = await prisma.guideKyc.findMany({
      where: { kycStatus: status as any },
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
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ kycRecords });
  } catch (error) {
    console.error('Error fetching KYC records:', error);
    return NextResponse.json({ error: 'Failed to fetch KYC records' }, { status: 500 });
  }
}
