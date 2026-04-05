import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/customer/bookings/[id] - Get single booking detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        guide: {
          include: {
            user: { select: { name: true, email: true, phone: true, image: true } },
            serviceAreas: {
              include: {
                state: { select: { name: true } },
              },
            },
          },
        },
        fixedDeparture: {
          include: {
            product: {
              select: {
                title: true,
                slug: true,
                coverImage: true,
                itinerary: true,
                inclusions: true,
                exclusions: true,
                cancellationPolicy: true,
                destination: {
                  select: { name: true, city: { select: { name: true, state: { select: { name: true } } } } },
                },
              },
            },
          },
        },
        product: {
          select: {
            title: true,
            slug: true,
            coverImage: true,
            destination: {
              select: { name: true, city: { select: { name: true, state: { select: { name: true } } } } },
            },
          },
        },
        review: true,
      },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // Ensure user can only see their own bookings (or admin)
    const role = (session.user as any).role;
    const userId = (session.user as any).id;
    if (booking.customerId !== userId && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
