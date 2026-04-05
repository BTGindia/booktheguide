import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/guide/bookings - List guide's bookings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const guide = await prisma.guideProfile.findUnique({
      where: { userId },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    const bookings = await prisma.booking.findMany({
      where: { guideId: guide.id },
      include: {
        customer: {
          select: { name: true, email: true, phone: true },
        },
        fixedDeparture: {
          include: {
            product: {
              select: {
                title: true,
                destination: { select: { name: true } },
              },
            },
          },
        },
        product: {
          select: {
            title: true,
            destination: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
