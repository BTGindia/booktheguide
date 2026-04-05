import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/guides/[id]/reviews — add a review (admin-created)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }

    // Create the review with the admin as the customer (admin-generated review)
    const review = await prisma.review.create({
      data: {
        guideId: params.id,
        customerId: userId,
        overallRating: parseInt(rating),
        comment: comment || '',
        isAdminReview: true,
      },
    });

    // Recalculate average rating
    const reviews = await prisma.review.findMany({
      where: { guideId: params.id },
    });
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
      : 0;

    await prisma.guideProfile.update({
      where: { id: params.id },
      data: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
      },
    });

    return NextResponse.json({ review, message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    return NextResponse.json({ error: 'Failed to add review' }, { status: 500 });
  }
}

// DELETE /api/admin/guides/[id]/reviews — delete a review
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    // Recalculate average rating
    const reviews = await prisma.review.findMany({
      where: { guideId: params.id },
    });
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
      : 0;

    await prisma.guideProfile.update({
      where: { id: params.id },
      data: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
      },
    });

    return NextResponse.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
