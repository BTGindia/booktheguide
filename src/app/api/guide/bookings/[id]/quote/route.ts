import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Guide sends a quote for a personal booking
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'GUIDE') {
      return NextResponse.json({ error: 'Only guides can send quotes' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const guide = await prisma.guideProfile.findUnique({ where: { userId } });
    if (!guide) return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.guideId !== guide.id) return NextResponse.json({ error: 'Not your booking' }, { status: 403 });
    if (booking.status !== 'AWAITING_QUOTE') {
      return NextResponse.json({ error: 'Booking is not awaiting a quote' }, { status: 400 });
    }

    const body = await req.json();
    const { packageDetails, totalAmount, commissionPercent } = body;

    if (!packageDetails || !Array.isArray(packageDetails) || packageDetails.length === 0) {
      return NextResponse.json({ error: 'Package details required (array of line items)' }, { status: 400 });
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Valid total amount required' }, { status: 400 });
    }

    // Calculate commission
    const commission = commissionPercent || 15;
    const commissionAmount = Math.round(totalAmount * commission / 100);

    // Update booking with quote
    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: 'QUOTE_SENT',
        packageDetails: packageDetails,
        totalAmount,
        baseAmount: totalAmount,
        commissionAmount,
      },
    });

    return NextResponse.json({
      message: 'Quote sent to customer',
      booking: updated,
    });
  } catch (error: any) {
    console.error('Quote send error:', error);
    return NextResponse.json({ error: 'Failed to send quote' }, { status: 500 });
  }
}
