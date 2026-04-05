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
    let stateFilter: any = {};

    if (role === 'ADMIN') {
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId },
        include: { managedStates: true },
      });
      if (adminProfile && adminProfile.managedStates.length > 0) {
        stateFilter = { stateId: { in: adminProfile.managedStates.map((s) => s.id) } };
      }
    }

    const regions = await prisma.region.findMany({
      where: stateFilter,
      include: {
        state: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ regions });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
  }
}
