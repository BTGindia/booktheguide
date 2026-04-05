import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/guide/products/[id] - Get product details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        destination: { include: { city: { include: { state: true } } } },
        guide: { include: { user: { select: { name: true } } } },
        fixedDepartures: { orderBy: { startDate: 'asc' } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT /api/guide/products/[id] - Update product
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const product = await prisma.product.findFirst({
      where: { id: params.id, guideId: guide.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found or not yours' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title, description, durationDays, durationNights,
      activityType, difficultyLevel, itinerary,
      inclusions, exclusions, highlights,
      coverImage, images, isPetFriendly, cancellationPolicy,
      minAge, maxAge,
    } = body;

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(durationDays && { durationDays }),
        ...(durationNights !== undefined && { durationNights }),
        ...(activityType && { activityType }),
        ...(difficultyLevel && { difficultyLevel }),
        ...(itinerary && { itinerary }),
        ...(inclusions && { inclusions }),
        ...(exclusions && { exclusions }),
        ...(highlights && { highlights }),
        ...(coverImage !== undefined && { coverImage }),
        ...(images && { images }),
        ...(isPetFriendly !== undefined && { isPetFriendly }),
        ...(cancellationPolicy !== undefined && { cancellationPolicy }),
        ...(minAge !== undefined && { minAge }),
        ...(maxAge !== undefined && { maxAge }),
        // Re-submit for review on major updates
        status: 'PENDING_REVIEW',
      },
    });

    return NextResponse.json({ product: updated, message: 'Product updated and resubmitted for review' });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/guide/products/[id] - Delete product
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const product = await prisma.product.findFirst({
      where: { id: params.id, guideId: guide.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found or not yours' }, { status: 404 });
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        fixedDeparture: { productId: params.id },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with active bookings' },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
