import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'STATE_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING_APPROVAL';

    // Build where clause
    const where: any = { approvalStatus: status };

    // For non-super-admin, filter by managed states
    if (role === 'ADMIN' || role === 'STATE_ADMIN') {
      const admin = await prisma.adminProfile.findUnique({
        where: { userId },
        include: { managedStates: { select: { id: true } } },
      });
      const managedStateIds = admin?.managedStates.map((s) => s.id) || [];
      if (managedStateIds.length > 0) {
        where.product = {
          destination: {
            city: { stateId: { in: managedStateIds } },
          },
        };
      }
    }

    const departures = await prisma.fixedDeparture.findMany({
      where,
      include: {
        product: {
          select: {
            title: true,
            slug: true,
            activityType: true,
            destination: {
              select: {
                name: true,
                city: { select: { name: true, state: { select: { name: true } } } },
              },
            },
            guide: {
              select: {
                user: { select: { name: true } },
              },
            },
          },
        },
        reviewedBy: {
          select: { user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ departures });
  } catch (error: any) {
    console.error('Admin departures list error:', error);
    return NextResponse.json({ error: 'Failed to fetch departures' }, { status: 500 });
  }
}
