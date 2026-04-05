import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guideProfile = await prisma.guideProfile.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (!guideProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const availability = await prisma.guideAvailability.findMany({
      where: {
        guideId: guideProfile.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Also fetch booked dates (confirmed bookings) for this month
    const bookings = await prisma.booking.findMany({
      where: {
        guideId: guideProfile.id,
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          {
            tripType: 'PERSONAL_BOOKING',
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
          {
            tripType: 'FIXED_DEPARTURE',
            fixedDeparture: {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          },
        ],
      },
      include: {
        fixedDeparture: {
          select: { startDate: true, endDate: true, product: { select: { title: true } } },
        },
      },
    });

    // Build a set of booked dates
    const bookedDates: { date: string; title: string }[] = [];
    for (const booking of bookings) {
      const bStart = booking.tripType === 'FIXED_DEPARTURE' && booking.fixedDeparture
        ? new Date(booking.fixedDeparture.startDate)
        : booking.startDate ? new Date(booking.startDate) : null;
      const bEnd = booking.tripType === 'FIXED_DEPARTURE' && booking.fixedDeparture
        ? new Date(booking.fixedDeparture.endDate)
        : booking.endDate ? new Date(booking.endDate) : null;

      if (bStart && bEnd) {
        const title = booking.tripType === 'FIXED_DEPARTURE' && booking.fixedDeparture
          ? booking.fixedDeparture.product?.title || 'Fixed Departure'
          : 'Personal Booking';

        for (let d = new Date(bStart); d <= bEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          bookedDates.push({ date: dateStr, title });
        }
      }
    }

    return NextResponse.json({ availability, bookedDates });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guideProfile = await prisma.guideProfile.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (!guideProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { dates, isAvailable } = body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: 'No dates provided' }, { status: 400 });
    }

    // Check for existing bookings on these dates
    for (const dateStr of dates) {
      const date = new Date(dateStr);

      // Check if guide has a confirmed booking on this date
      const existingBooking = await prisma.booking.findFirst({
        where: {
          guideId: guideProfile.id,
          status: { in: ['CONFIRMED', 'PENDING'] },
          OR: [
            // Personal bookings
            {
              tripType: 'PERSONAL_BOOKING',
              startDate: { lte: date },
              endDate: { gte: date },
            },
            // Fixed departures
            {
              tripType: 'FIXED_DEPARTURE',
              fixedDeparture: {
                startDate: { lte: date },
                endDate: { gte: date },
              },
            },
          ],
        },
      });

      if (existingBooking && !isAvailable) {
        // Can't mark unavailable if there's a booking
        return NextResponse.json(
          { error: `Cannot mark ${dateStr} as unavailable - there is an active booking` },
          { status: 400 }
        );
      }
    }

    // Upsert availability for each date
    const results = await Promise.all(
      dates.map((dateStr: string) =>
        prisma.guideAvailability.upsert({
          where: {
            guideId_date: {
              guideId: guideProfile.id,
              date: new Date(dateStr),
            },
          },
          update: {
            isAvailable,
          },
          create: {
            guideId: guideProfile.id,
            date: new Date(dateStr),
            isAvailable,
          },
        })
      )
    );

    return NextResponse.json({ message: 'Availability updated', count: results.length });
  } catch (error) {
    console.error('Availability error:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
