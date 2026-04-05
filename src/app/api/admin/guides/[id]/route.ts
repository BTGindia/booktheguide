import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/guides/[id] — fetch full guide details
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'GUIDE_MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const guide = await prisma.guideProfile.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true, image: true, phone: true, createdAt: true } },
        serviceAreas: {
          include: {
            state: { select: { name: true } },
          },
        },
        products: {
          include: {
            destination: { include: { city: { include: { state: true } } } },
            _count: { select: { bookings: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          include: {
            customer: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    return NextResponse.json({ guide });
  } catch (error) {
    console.error('Error fetching guide:', error);
    return NextResponse.json({ error: 'Failed to fetch guide' }, { status: 500 });
  }
}

// PUT /api/admin/guides/[id] — update guide profile fields
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'GUIDE_MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      bio, tagline, experienceYears, totalTrips,
      averageRating, isVerified, createdAt,
    } = body;

    const data: any = {};
    if (bio !== undefined) data.bio = bio;
    if (tagline !== undefined) data.tagline = tagline;
    if (experienceYears !== undefined) data.experienceYears = parseInt(experienceYears);
    if (totalTrips !== undefined) data.totalTrips = parseInt(totalTrips);
    if (averageRating !== undefined) data.averageRating = parseFloat(averageRating);
    if (isVerified !== undefined) data.isVerified = isVerified;
    if (createdAt !== undefined) data.createdAt = new Date(createdAt);

    const guide = await prisma.guideProfile.update({
      where: { id: params.id },
      data,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ guide, message: 'Guide updated successfully' });
  } catch (error) {
    console.error('Error updating guide:', error);
    return NextResponse.json({ error: 'Failed to update guide' }, { status: 500 });
  }
}
