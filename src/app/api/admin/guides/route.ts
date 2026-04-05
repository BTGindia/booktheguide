import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/guides - List all guides
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'GUIDE_MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    let where: any = {};

    // State-based admin can only see guides in their states
    // Guide Managers and Super Admins see all guides
    if (role === 'ADMIN') {
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId },
        include: { managedStates: true },
      });
      if (adminProfile && adminProfile.managedStates.length > 0) {
        const stateIds = adminProfile.managedStates.map((s) => s.id);
        where = {
          serviceAreas: {
            some: { stateId: { in: stateIds } },
          },
        };
      }
    }

    const guides = await prisma.guideProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, image: true } },
        serviceAreas: { include: { state: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ guides });
  } catch (error) {
    console.error('Error fetching guides:', error);
    return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
  }
}
