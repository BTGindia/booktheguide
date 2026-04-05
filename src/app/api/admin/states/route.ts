import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/states — list all states with package counts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const states = await prisma.indianState.findMany({
      include: {
        _count: {
          select: {
            cities: true,
            serviceAreas: true,
          },
        },
        cities: {
          include: {
            destinations: {
              include: {
                _count: {
                  select: {
                    products: {
                      where: { status: 'APPROVED', isActive: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const statesWithCounts = states.map((s) => {
      const packageCount = s.cities.reduce(
        (sum, city) => sum + city.destinations.reduce((dSum, dest) => dSum + dest._count.products, 0),
        0
      );
      return {
        id: s.id,
        name: s.name,
        code: s.code,
        isActive: s.isActive,
        isNorthIndia: s.isNorthIndia,
        commissionPercent: s.commissionPercent,
        cityCount: s._count.cities,
        guideCount: s._count.serviceAreas,
        packageCount,
      };
    });

    return NextResponse.json({ states: statesWithCounts });
  } catch (error) {
    console.error('Admin states GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch states' }, { status: 500 });
  }
}

// PUT /api/admin/states — toggle isActive for a state
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'id and isActive (boolean) are required' }, { status: 400 });
    }

    const updated = await prisma.indianState.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ message: `State ${updated.name} ${isActive ? 'enabled' : 'disabled'}`, state: updated });
  } catch (error) {
    console.error('Admin states PUT error:', error);
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  }
}
