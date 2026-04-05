import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateProfileCompleteness, recalculateProfileCompleteness } from '@/lib/profile-completeness';

// GET /api/guide/completeness — Get profile completeness breakdown
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const guide = await prisma.guideProfile.findUnique({
      where: { userId },
      include: {
        serviceAreas: { select: { id: true } },
        operatingRegions: { select: { id: true } },
        guideCertifications: { select: { id: true } },
        kyc: { select: { kycStatus: true } },
      },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    const profileData = {
      legalName: guide.legalName,
      displayName: guide.displayName,
      shortBio: guide.shortBio,
      bio: guide.bio,
      tagline: guide.tagline,
      phone: guide.phone,
      email: guide.email,
      gender: guide.gender,
      dateOfBirth: guide.dateOfBirth,
      district: guide.district,
      addressState: guide.addressState,
      pincode: guide.pincode,
      experienceYears: guide.experienceYears,
      maxAltitudeLed: guide.maxAltitudeLed,
      languages: guide.languages,
      specializations: guide.specializations,
      guideTypes: guide.guideTypes,
      coverImage: guide.coverImage,
      portfolioImages: guide.portfolioImages,
      phoneVerified: guide.phoneVerified,
      verificationStatus: guide.verificationStatus,
      _certCount: guide.guideCertifications.length,
      _serviceAreaCount: guide.serviceAreas.length,
      _operatingRegionCount: guide.operatingRegions.length,
      _kycSubmitted: guide.kyc?.kycStatus !== 'NOT_SUBMITTED' && !!guide.kyc,
    };

    const breakdown = calculateProfileCompleteness(profileData);

    return NextResponse.json({ completeness: breakdown });
  } catch (error) {
    console.error('Error fetching completeness:', error);
    return NextResponse.json({ error: 'Failed to fetch completeness' }, { status: 500 });
  }
}

// POST /api/guide/completeness — Force recalculate
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const guide = await prisma.guideProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    const score = await recalculateProfileCompleteness(guide.id);
    return NextResponse.json({ score });
  } catch (error) {
    console.error('Error recalculating completeness:', error);
    return NextResponse.json({ error: 'Failed to recalculate' }, { status: 500 });
  }
}
