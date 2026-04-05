import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/super-admin/guides - Get all guides with detailed stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const guides = await prisma.guideProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        serviceAreas: {
          include: {
            state: { select: { name: true } },
          },
        },
        products: {
          select: {
            id: true,
            status: true,
            fixedDepartures: {
              select: {
                id: true,
                approvalStatus: true,
              },
            },
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedGuides = guides.map((guide) => {
      const totalPackages = guide.products.length;
      const approvedPackages = guide.products.filter((p) => p.status === 'APPROVED').length;
      const allDepartures = guide.products.flatMap((p) => p.fixedDepartures);
      const approvedDepartures = allDepartures.filter((d) => d.approvalStatus === 'APPROVED').length;
      const completedTrips = guide.bookings.filter((b) => b.status === 'COMPLETED').length;

      // Base location from service areas
      const baseLocation = guide.serviceAreas.length > 0
        ? guide.serviceAreas.map((sa) => sa.state.name).join(', ')
        : 'Not set';

      return {
        id: guide.id,
        userId: guide.user.id,
        name: guide.user.name,
        email: guide.user.email,
        phone: guide.user.phone,
        slug: guide.slug,
        bio: guide.bio,
        address: guide.addressLine,
        baseLocation,
        isVerified: guide.isVerified,
        isActive: guide.isActive,
        averageRating: guide.averageRating,
        totalReviews: guide.totalReviews,
        totalPackages,
        approvedPackages,
        approvedDepartures,
        completedTrips,
        totalTrips: guide.totalTrips,
        experienceYears: guide.experienceYears,
        languages: guide.languages,
        specializations: guide.specializations,
        certifications: guide.certifications,
        guideScore: guide.guideScore,
        joinedOn: guide.user.createdAt,
        createdAt: guide.createdAt,
      };
    });

    return NextResponse.json({ guides: enrichedGuides });
  } catch (error) {
    console.error('Error fetching guides:', error);
    return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
  }
}

// PUT /api/super-admin/guides - Update guide profile (super admin)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { guideId, name, isVerified, isActive, averageRating, bio, address, experienceYears, languages, specializations, certifications } = body;

    if (!guideId) {
      return NextResponse.json({ error: 'Guide ID required' }, { status: 400 });
    }

    const guide = await prisma.guideProfile.findUnique({
      where: { id: guideId },
      include: { user: { select: { id: true } } },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    // Update user name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: guide.user.id },
        data: { name },
      });
    }

    // Build guide profile update
    const guideUpdate: any = {};
    if (isVerified !== undefined) guideUpdate.isVerified = Boolean(isVerified);
    if (isActive !== undefined) guideUpdate.isActive = Boolean(isActive);
    if (averageRating !== undefined) {
      const rating = Number(averageRating);
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        guideUpdate.averageRating = rating;
      }
    }
    if (bio !== undefined) guideUpdate.bio = bio;
    if (address !== undefined) guideUpdate.address = address;
    if (experienceYears !== undefined) guideUpdate.experienceYears = Number(experienceYears) || 0;
    if (languages !== undefined) guideUpdate.languages = languages;
    if (specializations !== undefined) guideUpdate.specializations = specializations;
    if (certifications !== undefined) guideUpdate.certifications = certifications;

    const updated = await prisma.guideProfile.update({
      where: { id: guideId },
      data: guideUpdate,
    });

    return NextResponse.json({ message: 'Guide updated successfully', guide: updated });
  } catch (error) {
    console.error('Error updating guide:', error);
    return NextResponse.json({ error: 'Failed to update guide' }, { status: 500 });
  }
}
