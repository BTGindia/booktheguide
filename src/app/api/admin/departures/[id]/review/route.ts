import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'STATE_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { action, commissionPercent, reviewNotes } = body;

    if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get the admin profile
    const admin = await prisma.adminProfile.findUnique({ where: { userId } });
    if (!admin) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 404 });
    }

    // Get the departure with product destination for jurisdiction check
    const departure = await prisma.fixedDeparture.findUnique({
      where: { id: params.id },
      include: {
        product: {
          include: {
            destination: {
              include: { city: { select: { stateId: true } } },
            },
            guide: {
              include: {
                serviceAreas: { select: { stateId: true } },
              },
            },
          },
        },
      },
    });

    if (!departure) {
      return NextResponse.json({ error: 'Departure not found' }, { status: 404 });
    }

    // For non-super-admin, check state jurisdiction based on product destination
    if (role === 'ADMIN' || role === 'STATE_ADMIN') {
      const managedAdmin = await prisma.adminProfile.findUnique({
        where: { userId },
        include: { managedStates: { select: { id: true } } },
      });
      const managedStateIds = managedAdmin?.managedStates.map((s) => s.id) || [];
      const productStateId = departure.product.destination?.city?.stateId;
      if (managedStateIds.length > 0 && (!productStateId || !managedStateIds.includes(productStateId))) {
        return NextResponse.json({ error: 'Not in your jurisdiction' }, { status: 403 });
      }
    }

    // Build update data
    const updateData: any = {
      approvalStatus: action,
      reviewedById: admin.id,
      reviewNotes: reviewNotes || null,
      reviewedAt: new Date(),
    };

    if (action === 'APPROVED') {
      // Auto-apply commission from the product's destination state
      const productStateId = departure.product.destination?.city?.stateId;
      let stateCommission = 15; // default
      if (productStateId) {
        const state = await prisma.indianState.findUnique({
          where: { id: productStateId },
          select: { commissionPercent: true },
        });
        if (state) stateCommission = state.commissionPercent;
      }
      updateData.commissionPercent = stateCommission;
    }

    const updated = await prisma.fixedDeparture.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      message: `Departure ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
      departure: updated,
    });
  } catch (error: any) {
    console.error('Departure review error:', error);
    return NextResponse.json({ error: 'Failed to review departure' }, { status: 500 });
  }
}
