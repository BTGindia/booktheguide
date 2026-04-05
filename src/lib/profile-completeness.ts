import prisma from '@/lib/prisma';

// ==========================================
// Profile Completeness Score (0-100%)
// ==========================================
// Calculated automatically from how many fields are filled.
// Shown to guide on dashboard: "Your profile is 68% complete"
// Tied to search ranking: 90% complete ranks higher than 50%.

interface ProfileForCompleteness {
  legalName: string | null;
  displayName: string | null;
  shortBio: string | null;
  bio: string | null;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  district: string | null;
  addressState: string | null;
  pincode: string | null;
  experienceYears: number | null;
  maxAltitudeLed: number | null;
  languages: string[];
  specializations: string[];
  guideTypes: string[];
  coverImage: string | null;
  portfolioImages: string[];
  phoneVerified: boolean;
  verificationStatus: string;
  _certCount: number;
  _serviceAreaCount: number;
  _operatingRegionCount: number;
  _kycSubmitted: boolean;
}

export interface CompletenessBreakdown {
  score: number;       // 0-100
  sections: {
    name: string;
    score: number;
    maxScore: number;
    fields: { name: string; filled: boolean; points: number }[];
  }[];
  missingFields: string[];
  tips: string[];
}

export function calculateProfileCompleteness(profile: ProfileForCompleteness): CompletenessBreakdown {
  const sections: CompletenessBreakdown['sections'] = [];
  const missingFields: string[] = [];
  let totalScore = 0;
  const totalMax = 100;

  // === Section 1: Identity & Contact (25 points) ===
  const identityFields = [
    { name: 'Display Name', filled: !!profile.displayName, points: 3 },
    { name: 'Phone (Verified)', filled: !!profile.phone && profile.phoneVerified, points: 5 },
    { name: 'Email', filled: !!profile.email, points: 3 },
    { name: 'Gender', filled: !!profile.gender, points: 2 },
    { name: 'Date of Birth', filled: !!profile.dateOfBirth, points: 2 },
    { name: 'District', filled: !!profile.district, points: 3 },
    { name: 'State', filled: !!profile.addressState, points: 3 },
    { name: 'Pin Code', filled: !!profile.pincode, points: 2 },
    { name: 'Profile Photo', filled: (profile.portfolioImages?.length || 0) > 0, points: 2 },
  ];
  const identityScore = identityFields.filter(f => f.filled).reduce((sum, f) => sum + f.points, 0);
  identityFields.filter(f => !f.filled).forEach(f => missingFields.push(f.name));
  sections.push({ name: 'Identity & Contact', score: identityScore, maxScore: 25, fields: identityFields });
  totalScore += identityScore;

  // === Section 2: Geographic Expertise (15 points) ===
  const geoFields = [
    { name: 'Service Area (State)', filled: profile._serviceAreaCount > 0, points: 5 },
    { name: 'Operating Regions', filled: profile._operatingRegionCount > 0, points: 5 },
    { name: 'Guide Type', filled: profile.guideTypes.length > 0, points: 5 },
  ];
  const geoScore = geoFields.filter(f => f.filled).reduce((sum, f) => sum + f.points, 0);
  geoFields.filter(f => !f.filled).forEach(f => missingFields.push(f.name));
  sections.push({ name: 'Geographic Expertise', score: geoScore, maxScore: 15, fields: geoFields });
  totalScore += geoScore;

  // === Section 3: Experience & Background (20 points) ===
  const expFields = [
    { name: 'Years of Experience', filled: (profile.experienceYears || 0) > 0, points: 4 },
    { name: 'Short Bio (card)', filled: !!profile.shortBio && profile.shortBio.length >= 20, points: 4 },
    { name: 'Full Bio', filled: !!profile.bio && profile.bio.length >= 50, points: 4 },
    { name: 'Languages', filled: profile.languages.length > 0, points: 4 },
    { name: 'Specializations', filled: profile.specializations.length > 0, points: 4 },
  ];
  const expScore = expFields.filter(f => f.filled).reduce((sum, f) => sum + f.points, 0);
  expFields.filter(f => !f.filled).forEach(f => missingFields.push(f.name));
  sections.push({ name: 'Experience & Background', score: expScore, maxScore: 20, fields: expFields });
  totalScore += expScore;

  // === Section 4: Certifications (20 points) ===
  const certFields = [
    { name: 'At least 1 Certification', filled: profile._certCount >= 1, points: 10 },
    { name: '2+ Certifications', filled: profile._certCount >= 2, points: 5 },
    { name: 'Max Altitude Led', filled: (profile.maxAltitudeLed || 0) > 0, points: 5 },
  ];
  const certScore = certFields.filter(f => f.filled).reduce((sum, f) => sum + f.points, 0);
  certFields.filter(f => !f.filled).forEach(f => missingFields.push(f.name));
  sections.push({ name: 'Certifications', score: certScore, maxScore: 20, fields: certFields });
  totalScore += certScore;

  // === Section 5: Portfolio & Media (10 points) ===
  const mediaFields = [
    { name: 'Cover Image', filled: !!profile.coverImage, points: 3 },
    { name: '4+ Portfolio Photos', filled: (profile.portfolioImages?.length || 0) >= 4, points: 5 },
    { name: 'Tagline', filled: !!profile.tagline, points: 2 },
  ];
  const mediaScore = mediaFields.filter(f => f.filled).reduce((sum, f) => sum + f.points, 0);
  mediaFields.filter(f => !f.filled).forEach(f => missingFields.push(f.name));
  sections.push({ name: 'Portfolio & Media', score: mediaScore, maxScore: 10, fields: mediaFields });
  totalScore += mediaScore;

  // === Section 6: Verification & KYC (10 points) ===
  const verifyFields = [
    { name: 'Profile Verified', filled: profile.verificationStatus === 'VERIFIED', points: 5 },
    { name: 'KYC Submitted', filled: profile._kycSubmitted, points: 5 },
  ];
  const verifyScore = verifyFields.filter(f => f.filled).reduce((sum, f) => sum + f.points, 0);
  verifyFields.filter(f => !f.filled).forEach(f => missingFields.push(f.name));
  sections.push({ name: 'Verification & KYC', score: verifyScore, maxScore: 10, fields: verifyFields });
  totalScore += verifyScore;

  // Normalize to 0-100
  const normalizedScore = Math.round((totalScore / totalMax) * 100);

  // Generate tips
  const tips: string[] = [];
  if (normalizedScore < 50) tips.push('Complete your basic identity details to improve visibility.');
  if (profile._certCount === 0) tips.push('Add your certifications to unlock full search visibility.');
  if (!profile.phoneVerified) tips.push('Verify your phone number — it\'s required for bookings.');
  if (profile.languages.length === 0) tips.push('Add languages you speak to appear in more search results.');
  if ((profile.portfolioImages?.length || 0) < 4) tips.push('Upload at least 4 portfolio photos for better engagement.');
  if (!profile.shortBio) tips.push('Write a short bio (300 chars) for your search card.');
  if (profile.verificationStatus !== 'VERIFIED') tips.push('Submit your profile for verification to be discoverable in search.');

  return {
    score: normalizedScore,
    sections,
    missingFields,
    tips,
  };
}

/**
 * Recalculate and persist completeness for a single guide
 */
export async function recalculateProfileCompleteness(guideId: string): Promise<number> {
  const guide = await prisma.guideProfile.findUnique({
    where: { id: guideId },
    include: {
      serviceAreas: { select: { id: true } },
      operatingRegions: { select: { id: true } },
      guideCertifications: { select: { id: true } },
      kyc: { select: { kycStatus: true } },
    },
  });

  if (!guide) return 0;

  const profileData: ProfileForCompleteness = {
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

  const { score } = calculateProfileCompleteness(profileData);

  await prisma.guideProfile.update({
    where: { id: guideId },
    data: { profileCompleteness: score },
  });

  return score;
}
