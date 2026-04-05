import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/destinations/hierarchy
// Returns full state -> city -> destination hierarchy with counts and activity types
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const states = await prisma.indianState.findMany({
      orderBy: { name: 'asc' },
      include: {
        cities: {
          orderBy: { name: 'asc' },
          include: {
            destinations: {
              orderBy: { name: 'asc' },
              include: {
                products: {
                  select: {
                    id: true,
                    activityType: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform data: compute counts and distinct activity types at each level
    const hierarchy = states.map((state) => {
      let stateTotalDestinations = 0;
      let stateTotalProducts = 0;
      const stateActivityTypes = new Set<string>();

      const cities = state.cities.map((city) => {
        let cityTotalProducts = 0;
        const cityActivityTypes = new Set<string>();

        const destinations = city.destinations.map((dest) => {
          const approvedProducts = dest.products.filter((p) => p.status === 'APPROVED');
          const activityTypes = Array.from(new Set(dest.products.map((p) => p.activityType)));
          activityTypes.forEach((t) => {
            cityActivityTypes.add(t);
            stateActivityTypes.add(t);
          });

          cityTotalProducts += dest.products.length;
          stateTotalProducts += dest.products.length;
          stateTotalDestinations++;

          return {
            id: dest.id,
            name: dest.name,
            description: dest.description,
            altitude: dest.altitude,
            bestMonths: dest.bestMonths,
            openMonths: dest.openMonths,
            avoidMonths: dest.avoidMonths,
            coverImage: dest.coverImage,
            images: dest.images,
            isActive: dest.isActive,
            createdAt: dest.createdAt,
            productCount: dest.products.length,
            approvedProductCount: approvedProducts.length,
            activityTypes,
          };
        });

        return {
          id: city.id,
          name: city.name,
          isActive: city.isActive,
          createdAt: city.createdAt,
          destinationCount: destinations.length,
          productCount: cityTotalProducts,
          activityTypes: Array.from(cityActivityTypes),
          destinations,
        };
      });

      return {
        id: state.id,
        name: state.name,
        code: state.code,
        isNorthIndia: state.isNorthIndia,
        commissionPercent: state.commissionPercent,
        isActive: state.isActive,
        createdAt: state.createdAt,
        cityCount: cities.length,
        destinationCount: stateTotalDestinations,
        productCount: stateTotalProducts,
        activityTypes: Array.from(stateActivityTypes),
        cities,
      };
    });

    return NextResponse.json({ hierarchy });
  } catch (error) {
    console.error('Hierarchy fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch hierarchy' }, { status: 500 });
  }
}
