import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateBookingNumber } from '@/lib/utils';
import { recalculateSingleGuideScore } from '@/lib/guide-score';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const {
      guideId, tripType, fixedDepartureId,
      startDate, endDate, numberOfGuests,
      specialRequests, guestDetails,
      meetingPoint, destinationName, requirements,
      guestEmail, guestName, guestPhone,
    } = body;

    // Determine customer userId â€” logged-in user or guest checkout via email
    let userId: string;

    if (session?.user) {
      userId = (session.user as any).id;
    } else {
      // Guest checkout: email is required
      if (!guestEmail || !guestName) {
        return NextResponse.json(
          { error: 'Email and name are required for guest booking' },
          { status: 400 }
        );
      }

      // Find or create a lightweight user record from email
      let user = await prisma.user.findUnique({ where: { email: guestEmail } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: guestEmail,
            name: guestName,
            phone: guestPhone || null,
            role: 'CUSTOMER',
            // No password â€” guest account; will use verification code later
          },
        });
      }
      userId = user.id;
    }

    // Validate guide exists
    const guide = await prisma.guideProfile.findUnique({
      where: { id: guideId },
    });

    if (!guide || !guide.isActive) {
      return NextResponse.json({ error: 'Guide not found or inactive' }, { status: 404 });
    }

    let baseAmount = 0;
    let commissionAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let bookingStatus: string = 'CONFIRMED';

    if (tripType === 'FIXED_DEPARTURE') {
      // Fixed departure booking
      if (!fixedDepartureId) {
        return NextResponse.json({ error: 'Fixed departure ID required' }, { status: 400 });
      }

      const departure = await prisma.fixedDeparture.findUnique({
        where: { id: fixedDepartureId },
        include: { product: true },
      });

      if (!departure || !departure.isActive) {
        return NextResponse.json({ error: 'Trip not found or inactive' }, { status: 404 });
      }

      // Only allow booking on approved departures
      if (departure.approvalStatus !== 'APPROVED') {
        return NextResponse.json({ error: 'This departure is not yet approved for bookings' }, { status: 400 });
      }

      const remaining = departure.totalSeats - departure.bookedSeats;
      if (remaining < numberOfGuests) {
        return NextResponse.json(
          { error: `Only ${remaining} seats remaining` },
          { status: 400 }
        );
      }

      baseAmount = departure.pricePerPerson * numberOfGuests;
      const commissionPct = departure.commissionPercent || 15;
      commissionAmount = (baseAmount * commissionPct) / 100;

      // GST on the base amount (travel services: 5% split into CGST 2.5% + SGST 2.5%)
      const cgstPct = departure.cgstPercent ?? 2.5;
      const sgstPct = departure.sgstPercent ?? 2.5;
      cgstAmount = Math.round((baseAmount * cgstPct) / 100);
      sgstAmount = Math.round((baseAmount * sgstPct) / 100);

      bookingStatus = 'CONFIRMED';

      // Update booked seats
      await prisma.fixedDeparture.update({
        where: { id: fixedDepartureId },
        data: { bookedSeats: { increment: numberOfGuests } },
      });

    } else {
      // Personal booking â€” new flow: customer submits request, guide will create a quote
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Check for conflicting bookings
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          guideId: guide.id,
          status: { in: ['CONFIRMED', 'PENDING', 'AWAITING_QUOTE', 'QUOTE_SENT'] },
          OR: [
            {
              tripType: 'PERSONAL_BOOKING',
              startDate: { lte: end },
              endDate: { gte: start },
            },
            {
              tripType: 'FIXED_DEPARTURE',
              fixedDeparture: {
                startDate: { lte: end },
                endDate: { gte: start },
              },
            },
          ],
        },
      });

      if (conflictingBooking) {
        return NextResponse.json(
          { error: 'Guide is not available for these dates' },
          { status: 400 }
        );
      }

      // Personal booking: amount starts at 0, guide will quote later
      baseAmount = 0;
      commissionAmount = 0;
      bookingStatus = 'AWAITING_QUOTE';
    }

    // Customer pays: base + GST. Commission is deducted from guide's share (not charged extra).
    const totalAmount = baseAmount + cgstAmount + sgstAmount;
    const bookingNumber = generateBookingNumber();

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        customerId: userId,
        guideId: guide.id,
        tripType,
        fixedDepartureId: fixedDepartureId || null,
        productId: tripType === 'FIXED_DEPARTURE' && fixedDepartureId
          ? (await prisma.fixedDeparture.findUnique({ where: { id: fixedDepartureId }, select: { productId: true } }))?.productId || null
          : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        numberOfGuests,
        guestDetails: guestDetails || null,
        meetingPoint: meetingPoint || null,
        destinationName: destinationName || null,
        requirements: requirements || null,
        baseAmount,
        commissionAmount,
        cgstAmount,
        sgstAmount,
        totalAmount,
        specialRequests: specialRequests || null,
        status: bookingStatus as any,
      },
    });

    // Recalculate guide score after new booking
    recalculateSingleGuideScore(guide.id).catch(console.error);

    return NextResponse.json({
      booking,
      message: tripType === 'FIXED_DEPARTURE' ? 'Booking confirmed!' : 'Booking request submitted! The guide will send you a quote.',
      bookingNumber,
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
