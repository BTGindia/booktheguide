import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/guide/departures - List guide's fixed departures
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

    const departures = await prisma.fixedDeparture.findMany({
      where: { product: { guideId: guide.id } },
      include: {
        product: {
          include: {
            destination: { include: { city: { include: { state: true } } } },
          },
        },
        bookings: {
          select: { id: true, bookingNumber: true, status: true, numberOfGuests: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ departures });
  } catch (error) {
    console.error('Error fetching departures:', error);
    return NextResponse.json({ error: 'Failed to fetch departures' }, { status: 500 });
  }
}

// POST /api/guide/departures - Create a fixed departure
export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      productId, startDate,
      totalSeats, pricePerPerson, meetingPoint,
      endingPoint, meetingTime, notes,
      maxGroupSize, minGroupSize, genderPolicy,
      pricingTiers, petPricing,
    } = body;

    // Validate product belongs to guide and is approved
    const product = await prisma.product.findFirst({
      where: { id: productId, guideId: guide.id, status: 'APPROVED' },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found, not yours, or not approved' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    // Auto-compute end date from product durationDays
    const end = new Date(start);
    end.setDate(end.getDate() + product.durationDays - 1);

    if (start <= new Date()) {
      return NextResponse.json(
        { error: 'Start date must be in the future' },
        { status: 400 }
      );
    }

    // Check for conflicting departures (no overlapping dates for same guide)
    const conflict = await prisma.fixedDeparture.findFirst({
      where: {
        product: { guideId: guide.id },
        isActive: true,
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'You already have a trip scheduled during these dates. Multiple departures cannot overlap.' },
        { status: 400 }
      );
    }

    // Check for exact same start date on same product
    const exactDuplicate = await prisma.fixedDeparture.findFirst({
      where: {
        productId,
        startDate: start,
        isActive: true,
      },
    });

    if (exactDuplicate) {
      return NextResponse.json(
        { error: 'A departure already exists for this product on the same start date.' },
        { status: 400 }
      );
    }

    const departure = await prisma.fixedDeparture.create({
      data: {
        productId,
        startDate: start,
        endDate: end,
        totalSeats: totalSeats || 15,
        bookedSeats: 0,
        maxGroupSize: maxGroupSize || totalSeats || 15,
        minGroupSize: minGroupSize || 1,
        genderPolicy: genderPolicy || 'MIXED',
        pricingTiers: pricingTiers || {},
        petPricing: petPricing || {},
        pricePerPerson: pricePerPerson || 0,
        meetingPoint: meetingPoint || null,
        endingPoint: endingPoint || null,
        meetingTime: meetingTime || '06:00 AM',
        notes: notes || null,
        isActive: true,
        approvalStatus: 'PENDING_APPROVAL',
      },
    });

    return NextResponse.json({ departure, message: 'Fixed departure created!' });
  } catch (error) {
    console.error('Error creating departure:', error);
    return NextResponse.json({ error: 'Failed to create departure' }, { status: 500 });
  }
}
