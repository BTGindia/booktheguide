import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/geography/destinations - All active destinations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');

    const where: any = { isActive: true };
    if (cityId) {
      where.cityId = cityId;
    }

    const destinations = await prisma.destination.findMany({
      where,
      include: {
        city: {
          include: { state: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ destinations });
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 });
  }
}
