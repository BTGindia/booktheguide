import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // For state admin, filter by managed states
    let guideFilter: any = {};
    if (role === 'ADMIN') {
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId },
        include: { managedStates: { select: { id: true } } },
      });
      const stateIds = adminProfile?.managedStates.map((s) => s.id) || [];
      guideFilter = { serviceAreas: { some: { stateId: { in: stateIds } } } };
    }

    const bookings = await prisma.booking.findMany({
      where: { guide: guideFilter },
      include: {
        customer: { select: { name: true, email: true } },
        guide: { include: { user: { select: { name: true } } } },
        product: { 
          select: { 
            title: true, 
            activityType: true,
            destination: { select: { city: { select: { state: { select: { name: true } } } } } },
          } 
        },
        fixedDeparture: {
          select: {
            startDate: true,
            endDate: true,
            product: { 
              select: { 
                title: true,
                activityType: true,
                destination: { select: { city: { select: { state: { select: { name: true } } } } } },
              } 
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Admin bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
