import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/guide/bookings/[id]/complete - Mark booking as completed
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const bookingId = params.id;

    // Get guide profile
    const guide = await prisma.guideProfile.findUnique({
      where: { userId },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    // Find the booking and verify it belongs to this guide
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        guideId: guide.id,
      },
      include: {
        fixedDeparture: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking is CONFIRMED
    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Only confirmed bookings can be marked as completed' },
        { status: 400 }
      );
    }

    // Check if the trip end date has passed
    const endDate = booking.fixedDeparture?.endDate || booking.endDate;
    if (endDate && new Date(endDate) > new Date()) {
      return NextResponse.json(
        { error: 'Cannot mark as completed until after the trip end date' },
        { status: 400 }
      );
    }

    // Update booking status to COMPLETED
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' },
    });

    // Update guide's total trips count
    await prisma.guideProfile.update({
      where: { id: guide.id },
      data: { totalTrips: { increment: 1 } },
    });

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking marked as completed',
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    return NextResponse.json({ error: 'Failed to complete booking' }, { status: 500 });
  }
}
