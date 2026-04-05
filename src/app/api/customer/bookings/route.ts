import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/customer/bookings - List customer bookings with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tripType = searchParams.get('tripType');

    const where: any = { customerId: userId };
    if (status) where.status = status;
    if (tripType) where.tripType = tripType;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        guide: {
          include: {
            user: { select: { name: true, image: true } },
            serviceAreas: { include: { state: { select: { name: true } } } },
          },
        },
        fixedDeparture: {
          include: {
            product: { select: { title: true, slug: true, coverImage: true, destination: { select: { name: true } } } },
          },
        },
        product: { select: { title: true, slug: true } },
        review: { select: { id: true, overallRating: true } },
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
