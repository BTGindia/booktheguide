import prisma from '@/lib/prisma';

// ============================
// Guide Health Score Calculator
// ============================
// Total: 100 points across 7 dimensions
// Recalculated daily or after key events (booking, review)

export interface ScoreBreakdown {
  conversion: number;    // max 25
  review: number;        // max 20
  reliability: number;   // max 20
  profile: number;       // max 10
  response: number;      // max 10
  availability: number;  // max 10
  experience: number;    // max 5
  total: number;         // max 100
}

export interface ScoreTip {
  dimension: string;
  score: number;
  maxScore: number;
  percentage: number;
  tips: string[];
}

const WEIGHTS = {
  conversion: 25,
  review: 20,
  reliability: 20,
  profile: 10,
  response: 10,
  availability: 10,
  experience: 5,
} as const;

// Minimum bookings/reviews before full scoring applies
const MIN_DATA_THRESHOLD = 5;

/**
 * Compute score for a single guide
 */
export async function computeGuideScore(guideId: string): Promise<ScoreBreakdown> {
  const guide = await prisma.guideProfile.findUnique({
    where: { id: guideId },
    include: {
      reviews: { select: { overallRating: true } },
      bookings: {
        select: {
          status: true,
          totalAmount: true,
          createdAt: true,
          cancelledAt: true,
        },
      },
      availability: {
        where: {
          date: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { isAvailable: true },
      },
      products: {
        where: { status: 'APPROVED' },
        select: { id: true },
      },
      _count: {
        select: { guideCertifications: true },
      },
    },
  });

  if (!guide) {
    return defaultScore();
  }

  const isNewGuide = guide.bookings.length < MIN_DATA_THRESHOLD && guide.reviews.length < MIN_DATA_THRESHOLD;

  // --- 1. Conversion Rate (max 25) ---
  const conversion = isNewGuide
    ? WEIGHTS.conversion * 0.5
    : computeConversion(guide.bookings.length, guide.totalTrips);

  // --- 2. Review Score (max 20) ---
  const review = computeReviewScore(guide.reviews.map(r => r.overallRating));

  // --- 3. Reliability (max 20) ---
  const reliability = isNewGuide
    ? WEIGHTS.reliability * 0.5
    : computeReliability(guide.bookings);

  // --- 4. Profile Completeness (max 10) ---
  // Use the pre-calculated profileCompleteness (0-100) from the guide profile if available
  const profile = guide.profileCompleteness
    ? (guide.profileCompleteness / 100) * WEIGHTS.profile
    : computeProfileCompleteness(guide);

  // --- 5. Response Rate & Speed (max 10) ---
  // We don't have a messages table, so use neutral default for now
  const response = isNewGuide ? WEIGHTS.response * 0.5 : WEIGHTS.response * 0.5;

  // --- 6. Availability (max 10) ---
  const availability = computeAvailability(guide.availability);

  // --- 7. Experience & Credentials (max 5) ---
  // Use GuideCertification model count if available, fall back to legacy certifications array
  const certCount = guide._count?.guideCertifications ?? guide.certifications.length;
  const experience = computeExperience(guide.experienceYears || 0, certCount);

  const total = Math.round((conversion + review + reliability + profile + response + availability + experience) * 10) / 10;

  return {
    conversion: round(conversion),
    review: round(review),
    reliability: round(reliability),
    profile: round(profile),
    response: round(response),
    availability: round(availability),
    experience: round(experience),
    total: Math.min(100, round(total)),
  };
}

/**
 * Recalculate and persist scores for ALL guides
 */
export async function recalculateAllGuideScores(): Promise<{ updated: number; errors: number }> {
  const guides = await prisma.guideProfile.findMany({
    select: { id: true },
  });

  let updated = 0;
  let errors = 0;

  for (const guide of guides) {
    try {
      const score = await computeGuideScore(guide.id);
      await prisma.guideProfile.update({
        where: { id: guide.id },
        data: {
          guideScore: score.total,
          scoreBreakdown: score as any,
          scoreUpdatedAt: new Date(),
        },
      });
      updated++;
    } catch (err) {
      console.error(`Score calc failed for guide ${guide.id}:`, err);
      errors++;
    }
  }

  return { updated, errors };
}

/**
 * Recalculate and persist score for ONE guide (after event)
 */
export async function recalculateSingleGuideScore(guideId: string): Promise<ScoreBreakdown> {
  const score = await computeGuideScore(guideId);
  await prisma.guideProfile.update({
    where: { id: guideId },
    data: {
      guideScore: score.total,
      scoreBreakdown: score as any,
      scoreUpdatedAt: new Date(),
    },
  });
  return score;
}

/**
 * Get actionable tips for a guide based on their scores
 */
export function getScoreTips(breakdown: ScoreBreakdown): ScoreTip[] {
  const tips: ScoreTip[] = [];

  // Conversion
  const convPct = (breakdown.conversion / WEIGHTS.conversion) * 100;
  const convTips: string[] = [];
  if (convPct < 50) convTips.push('Add high-quality cover images to attract more bookings.');
  if (convPct < 70) convTips.push('Write a compelling bio and tagline to improve conversions.');
  if (convPct < 90) convTips.push('Ensure pricing is competitive for your region.');
  tips.push({ dimension: 'Conversion Rate', score: breakdown.conversion, maxScore: WEIGHTS.conversion, percentage: round(convPct), tips: convTips });

  // Review
  const revPct = (breakdown.review / WEIGHTS.review) * 100;
  const revTips: string[] = [];
  if (revPct < 50) revTips.push('Encourage satisfied travellers to leave reviews after trips.');
  if (revPct < 70) revTips.push('Focus on communication and safety to improve ratings.');
  if (revPct < 90) revTips.push('Respond promptly to reviews to show engagement.');
  tips.push({ dimension: 'Review Score', score: breakdown.review, maxScore: WEIGHTS.review, percentage: round(revPct), tips: revTips });

  // Reliability
  const relPct = (breakdown.reliability / WEIGHTS.reliability) * 100;
  const relTips: string[] = [];
  if (relPct < 50) relTips.push('Reduce cancellations — cancel only for genuine emergencies.');
  if (relPct < 70) relTips.push('Accept booking requests promptly to improve reliability.');
  if (relPct < 90) relTips.push('Maintain a 100% show-up rate for confirmed bookings.');
  tips.push({ dimension: 'Reliability', score: breakdown.reliability, maxScore: WEIGHTS.reliability, percentage: round(relPct), tips: relTips });

  // Profile
  const proPct = (breakdown.profile / WEIGHTS.profile) * 100;
  const proTips: string[] = [];
  if (proPct < 50) proTips.push('Complete your profile — add bio, certifications, and photos.');
  if (proPct < 70) proTips.push('Upload more portfolio images to showcase your experiences.');
  if (proPct < 90) proTips.push('Add more languages and certifications to boost your profile score.');
  tips.push({ dimension: 'Profile Completeness', score: breakdown.profile, maxScore: WEIGHTS.profile, percentage: round(proPct), tips: proTips });

  // Response
  const resPct = (breakdown.response / WEIGHTS.response) * 100;
  const resTips: string[] = [];
  if (resPct < 50) resTips.push('Reply to all booking inquiries within 1 hour.');
  if (resPct < 70) resTips.push('Enable notifications so you never miss a message.');
  if (resPct < 90) resTips.push('Aim for a 100% response rate to maximise this score.');
  tips.push({ dimension: 'Response Rate & Speed', score: breakdown.response, maxScore: WEIGHTS.response, percentage: round(resPct), tips: resTips });

  // Availability
  const avaPct = (breakdown.availability / WEIGHTS.availability) * 100;
  const avaTips: string[] = [];
  if (avaPct < 30) avaTips.push('Update your availability calendar — most days are blocked.');
  if (avaPct < 60) avaTips.push('Open more dates in the next 30 days to get more bookings.');
  if (avaPct < 90) avaTips.push('Keep your calendar updated to show travellers you are active.');
  tips.push({ dimension: 'Availability', score: breakdown.availability, maxScore: WEIGHTS.availability, percentage: round(avaPct), tips: avaTips });

  // Experience
  const expPct = (breakdown.experience / WEIGHTS.experience) * 100;
  const expTips: string[] = [];
  if (expPct < 50) expTips.push('Add formal certifications (NIMAS, WFR, etc.) to boost this score.');
  if (expPct < 90) expTips.push('Update your years of experience as you gain more.');
  tips.push({ dimension: 'Experience & Credentials', score: breakdown.experience, maxScore: WEIGHTS.experience, percentage: round(expPct), tips: expTips });

  return tips;
}

// ============================
// Internal computation helpers
// ============================

function computeConversion(totalBookings: number, totalTrips: number): number {
  // Using totalBookings vs totalTrips as proxy for views → bookings
  // In production, you'd track profile views separately
  if (totalBookings === 0) return WEIGHTS.conversion * 0.5;
  const rate = Math.min(totalTrips / Math.max(totalBookings, 1), 1);
  return rate * WEIGHTS.conversion;
}

function computeReviewScore(ratings: number[]): number {
  if (ratings.length === 0) return WEIGHTS.review * 0.5;
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const normalizedAvg = avg / 5; // 0-1
  const volumeBoost = Math.min(ratings.length, 50) / 50; // 0-1
  const score = ((normalizedAvg * volumeBoost * 0.8) + (normalizedAvg * 0.2)) * WEIGHTS.review;
  return Math.min(WEIGHTS.review, score);
}

function computeReliability(bookings: { status: string; createdAt: Date; cancelledAt: Date | null }[]): number {
  if (bookings.length === 0) return WEIGHTS.reliability * 0.5;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentBookings = bookings.filter(b => new Date(b.createdAt) >= thirtyDaysAgo);
  const totalRecent = recentBookings.length || 1;

  const completed = recentBookings.filter(b => b.status === 'COMPLETED').length;
  const cancelled = recentBookings.filter(b => b.status === 'CANCELLED' && b.cancelledAt).length;

  const acceptanceRate = Math.min((completed + recentBookings.filter(b => b.status === 'CONFIRMED').length) / totalRecent, 1);
  const cancellationRate = Math.min(cancelled / totalRecent, 1);
  const noShowRate = 0; // We don't have a no-show status, default to 0

  const score = (
    acceptanceRate * 0.4 +
    (1 - cancellationRate) * 0.3 +
    (1 - noShowRate) * 0.3
  ) * WEIGHTS.reliability;

  return Math.min(WEIGHTS.reliability, score);
}

function computeProfileCompleteness(guide: {
  bio: string | null;
  tagline: string | null;
  coverImage: string | null;
  portfolioImages: string[];
  certifications: string[];
  languages: string[];
  specializations: string[];
  isVerified: boolean;
  idType: string | null;
  idNumber: string | null;
  guideTypes: string[];
  experienceYears: number | null;
  gender: string | null;
  phone: string | null;
  addressLine: string | null;
}): number {
  let completionPoints = 0;
  const maxPoints = 20;

  // Bio (2 points)
  if (guide.bio && guide.bio.length > 50) completionPoints += 2;
  else if (guide.bio) completionPoints += 1;

  // Tagline (1 point)
  if (guide.tagline) completionPoints += 1;

  // Cover image (1 point)
  if (guide.coverImage) completionPoints += 1;

  // Portfolio images (capped at 5 points based on count, max at 5 images)
  completionPoints += Math.min(guide.portfolioImages.length, 5);

  // Certifications (capped at 2 points, +1 per cert up to 2)
  completionPoints += Math.min(guide.certifications.length * 1, 2);

  // Languages (capped at 2 points)
  completionPoints += Math.min(guide.languages.length, 2);

  // Guide type selected (1 point)
  if (guide.guideTypes.length > 0) completionPoints += 1;

  // ID verified (2 points)
  if (guide.isVerified) completionPoints += 2;

  // Phone (1 point)
  if (guide.phone) completionPoints += 1;

  // Address (1 point)
  if (guide.addressLine) completionPoints += 1;

  // Gender (1 point)
  if (guide.gender) completionPoints += 1;

  const ratio = Math.min(completionPoints / maxPoints, 1);
  return ratio * WEIGHTS.profile;
}

function computeAvailability(availability: { isAvailable: boolean }[]): number {
  if (availability.length === 0) {
    // No availability data set — use neutral default
    return WEIGHTS.availability * 0.5;
  }
  const availableDays = availability.filter(a => a.isAvailable).length;
  const ratio = availableDays / 30;
  return Math.min(WEIGHTS.availability, ratio * WEIGHTS.availability);
}

function computeExperience(years: number, certCount: number): number {
  const yearsScore = Math.min(years, 10) / 10;
  const certScore = Math.min(certCount / 3, 1);
  return (yearsScore * 0.5 + certScore * 0.5) * WEIGHTS.experience;
}

function defaultScore(): ScoreBreakdown {
  return {
    conversion: round(WEIGHTS.conversion * 0.5),
    review: round(WEIGHTS.review * 0.5),
    reliability: round(WEIGHTS.reliability * 0.5),
    profile: 0,
    response: round(WEIGHTS.response * 0.5),
    availability: round(WEIGHTS.availability * 0.5),
    experience: 0,
    total: round((WEIGHTS.conversion + WEIGHTS.review + WEIGHTS.reliability + WEIGHTS.response + WEIGHTS.availability) * 0.5),
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
