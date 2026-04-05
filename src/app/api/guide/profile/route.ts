import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { FIELD_OWNERSHIP } from '@/lib/taxonomy';
import { versionFields } from '@/lib/audit';
import { recalculateProfileCompleteness } from '@/lib/profile-completeness';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const profile = await prisma.guideProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { image: true, name: true, email: true, phone: true } },
        serviceAreas: {
          include: {
            state: { select: { id: true, name: true } },
          },
        },
        operatingRegions: {
          include: {
            region: { select: { id: true, name: true } },
          },
        },
        operatingDestinations: {
          include: {
            destination: { select: { id: true, name: true } },
          },
        },
        guideCertifications: {
          orderBy: { createdAt: 'desc' },
        },
        kyc: {
          select: {
            aadhaarLast4: true,
            aadhaarVerified: true,
            panNumber: true,
            panVerified: true,
            bankVerified: true,
            kycStatus: true,
            payoutEligible: true,
          },
        },
      },
    });

    const profileData = profile ? {
      ...profile,
      stateId: profile.serviceAreas?.[0]?.stateId || '',
      idProofType: profile.idType || '',
      idProofNumber: profile.idNumber || '',
      // Pre-fill phone/email from user if not set on profile
      phone: profile.phone || profile.user?.phone || '',
      email: profile.email || profile.user?.email || '',
    } : null;

    return NextResponse.json({ profile: profileData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    const {
      bio, shortBio, tagline, displayName,
      addressLine, cityTown, district, addressState, country, pincode,
      phone, email,
      selectedStates, selectedRegions, selectedDestinations,
      experienceYears, maxAltitudeLed,
      education, certifications, certificationDocs, languages, specializations,
      specializationProofs, idProofType, idProofNumber,
      profileImage, coverImage, portfolioImages,
      gender, dateOfBirth, maritalStatus, guideTypes,
      termsAccepted,
    } = body;

    // Phone validation: must match Indian mobile format
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Phone number must be a valid 10-digit Indian mobile number' }, { status: 400 });
    }

    // Bio character limit validation (spec: shortBio 300, bio 1000)
    if (shortBio && shortBio.length > 300) {
      return NextResponse.json({ error: 'Short bio must be 300 characters or less' }, { status: 400 });
    }
    if (bio && bio.length > 1000) {
      return NextResponse.json({ error: 'Bio must be 1000 characters or less' }, { status: 400 });
    }

    // Experience & altitude bounds
    if (experienceYears !== undefined && (experienceYears < 0 || experienceYears > 60)) {
      return NextResponse.json({ error: 'Experience years must be between 0 and 60' }, { status: 400 });
    }
    if (maxAltitudeLed !== undefined && (maxAltitudeLed < 0 || maxAltitudeLed > 9000)) {
      return NextResponse.json({ error: 'Maximum altitude led must be between 0 and 9000 metres' }, { status: 400 });
    }

    // Generate slug from user name
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const baseSlug = slugify(user.name);
    let slug = baseSlug;
    let counter = 1;

    const existing = await prisma.guideProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      while (await prisma.guideProfile.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Detect jointly-owned field changes that need review flags
    const pendingReviewFields: string[] = existing?.pendingReviewFields || [];
    const jointlyOwnedChanges: string[] = [];

    if (existing) {
      const jointlyOwnedFields = ['languages', 'specializations', 'guideTypes'];
      for (const field of jointlyOwnedFields) {
        const oldVal = JSON.stringify((existing as any)[field] || []);
        const newVal = JSON.stringify(body[field] || []);
        if (oldVal !== newVal) {
          jointlyOwnedChanges.push(field);
        }
      }
    }

    // Version critical data before overwriting (bio, descriptions changed)
    if (existing) {
      const versionableChanges: { fieldName: string; oldValue: string | null; newValue: string | null }[] = [];
      if (bio !== undefined && existing.bio !== bio) {
        versionableChanges.push({ fieldName: 'bio', oldValue: existing.bio, newValue: bio });
      }
      if (shortBio !== undefined && existing.shortBio !== shortBio) {
        versionableChanges.push({ fieldName: 'shortBio', oldValue: existing.shortBio, newValue: shortBio });
      }
      if (tagline !== undefined && existing.tagline !== tagline) {
        versionableChanges.push({ fieldName: 'tagline', oldValue: existing.tagline, newValue: tagline });
      }
      if (versionableChanges.length > 0) {
        await versionFields({
          entityType: 'GuideProfile',
          entityId: existing.id,
          guideId: existing.id,
          changedById: userId,
          changes: versionableChanges,
        });
      }
    }

    // Enforce separation: guides CANNOT write to platform-owned fields
    // verificationStatus, isVerified, kycStatus, payoutEligible, legalName, guideScore
    // are intentionally excluded from this endpoint

    const profileData: any = {
      bio,
      shortBio: shortBio || null,
      tagline,
      displayName: displayName || null,
      addressLine: addressLine || null,
      cityTown: cityTown || null,
      district: district || null,
      addressState: addressState || null,
      country: country || 'India',
      pincode: pincode || null,
      phone: phone || null,
      email: email || null,
      experienceYears: Number(experienceYears),
      maxAltitudeLed: maxAltitudeLed ? Number(maxAltitudeLed) : null,
      education,
      certifications: certifications || [],
      certificationDocs: certificationDocs || [],
      languages: languages || [],
      specializations: specializations || [],
      specializationProofs: specializationProofs || [],
      idType: idProofType,
      idNumber: idProofNumber,
      coverImage: coverImage || null,
      portfolioImages: portfolioImages || [],
      gender: gender || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      maritalStatus: maritalStatus || null,
      guideTypes: guideTypes || [],
      termsAccepted: termsAccepted || false,
      termsAcceptedAt: termsAccepted ? new Date() : null,
      // Add review flags for jointly-owned field changes
      pendingReviewFields: Array.from(new Set([...pendingReviewFields, ...jointlyOwnedChanges])),
    };

    // Update user profile image
    if (profileImage !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { image: profileImage || null },
      });
    }

    const profile = existing
      ? await prisma.guideProfile.update({
          where: { userId },
          data: profileData,
        })
      : await prisma.guideProfile.create({
          data: {
            ...profileData,
            userId,
            slug,
          },
        });

    // Handle service areas (multiple states)
    if (selectedStates && Array.isArray(selectedStates) && selectedStates.length > 0) {
      await prisma.guideServiceArea.deleteMany({ where: { guideId: profile.id } });
      for (const stateId of selectedStates) {
        await prisma.guideServiceArea.create({
          data: { guideId: profile.id, stateId },
        });
      }
    }

    // Handle operating regions (structured multi-select from taxonomy)
    if (selectedRegions && Array.isArray(selectedRegions)) {
      await prisma.guideOperatingRegion.deleteMany({ where: { guideId: profile.id } });
      for (const regionId of selectedRegions) {
        await prisma.guideOperatingRegion.create({
          data: { guideId: profile.id, regionId },
        });
      }
    }

    // Handle operating destinations (controlled vocabulary)
    if (selectedDestinations && Array.isArray(selectedDestinations)) {
      await prisma.guideOperatingDestination.deleteMany({ where: { guideId: profile.id } });
      for (const destinationId of selectedDestinations) {
        await prisma.guideOperatingDestination.create({
          data: { guideId: profile.id, destinationId },
        });
      }
    }

    // Recalculate profile completeness
    await recalculateProfileCompleteness(profile.id);

    return NextResponse.json({ profile, message: 'Profile saved' });
  } catch (error) {
    console.error('Guide profile error:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
