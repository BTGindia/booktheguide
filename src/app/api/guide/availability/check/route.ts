import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/guide/availability/check?guideId=&year=&month=
// Public endpoint to check a guide's availability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get('guideId');
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');

    if (!guideId || !year || !month) {
      return NextResponse.json(
        { error: 'guideId, year, and month are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const availability = await prisma.guideAvailability.findMany({
      where: {
        guideId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        isAvailable: true,
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}
