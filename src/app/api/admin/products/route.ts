import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/products - List all products for admin review
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'STATE_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    let where: any = {};

    // State-based admin filtering (for state admins / admin accounts with managedStates)
    if (role === 'ADMIN' || role === 'STATE_ADMIN') {
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId },
        include: { managedStates: true },
      });
      if (adminProfile && adminProfile.managedStates.length > 0) {
        const stateIds = adminProfile.managedStates.map((s) => s.id);
        where = {
          destination: {
            city: { stateId: { in: stateIds } },
          },
        };
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        guide: {
          select: { averageRating: true, guideScore: true, user: { select: { name: true } } },
        },
        destination: {
          include: { city: { include: { state: true } } },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
