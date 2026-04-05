import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { recalculateSingleGuideScore } from '@/lib/guide-score';

export const dynamic = 'force-dynamic';

// GET /api/reviews - Get reviews (for customer: their reviews, for guide: reviews of them)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { searchParams } = new URL(request.url);
    const guideSlug = searchParams.get('guide');

    let where: any = {};

    if (guideSlug) {
      // Public reviews for a guide
      const guide = await prisma.guideProfile.findUnique({
        where: { slug: guideSlug },
      });
      if (!guide) {
        return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
      }
      where = { guideId: guide.id };
    } else if (role === 'GUIDE') {
      const guide = await prisma.guideProfile.findUnique({
        where: { userId },
      });
      if (!guide) {
        return NextResponse.json({ reviews: [] });
      }
      where = { guideId: guide.id };
    } else {
      where = { customerId: userId };
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        customer: { select: { name: true, image: true } },
        guide: {
          include: {
            user: { select: { name: true } },
          },
        },
        booking: {
          select: {
            bookingNumber: true,
            tripType: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews - Create a review
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const {
      bookingId,
      overallRating,
      knowledgeRating,
      communicationRating,
      valueForMoneyRating,
      safetyRating,
      comment,
    } = body;

    if (!bookingId || !overallRating) {
      return NextResponse.json({ error: 'Booking ID and rating required' }, { status: 400 });
    }

    // Verify booking belongs to user and is completed
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: userId,
        status: 'COMPLETED',
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or not eligible for review' },
        { status: 400 }
      );
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: { bookingId, customerId: userId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this booking' },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        customerId: userId,
        guideId: booking.guideId,
        overallRating: Math.min(5, Math.max(1, overallRating)),
        knowledgeRating: knowledgeRating ? Math.min(5, Math.max(1, knowledgeRating)) : null,
        communicationRating: communicationRating ? Math.min(5, Math.max(1, communicationRating)) : null,
        valueForMoneyRating: valueForMoneyRating ? Math.min(5, Math.max(1, valueForMoneyRating)) : null,
        safetyRating: safetyRating ? Math.min(5, Math.max(1, safetyRating)) : null,
        comment: comment?.trim() || null,
      },
    });

    // Update guide's average rating
    const avgResult = await prisma.review.aggregate({
      where: { guideId: booking.guideId },
      _avg: { overallRating: true },
      _count: { overallRating: true },
    });

    await prisma.guideProfile.update({
      where: { id: booking.guideId },
      data: {
        averageRating: avgResult._avg.overallRating || 0,
        totalReviews: avgResult._count.overallRating || 0,
      },
    });

    // Recalculate guide score after new review
    recalculateSingleGuideScore(booking.guideId).catch(console.error);

    return NextResponse.json({ review, message: 'Review submitted!' });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
