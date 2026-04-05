import { z } from 'zod';
import { CERTIFICATION_TYPES, ISSUING_AUTHORITIES, LANGUAGES as TAXONOMY_LANGUAGES, SPECIALIZATIONS, PACKAGE_CATEGORIES, DIFFICULTY_LEVELS, MONTHS, PRICING_LIMITS } from './taxonomy';

// Indian mobile phone format: 10 digits starting with 6-9
const indianPhoneRegex = /^[6-9]\d{9}$/;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(indianPhoneRegex, 'Must be a valid 10-digit Indian mobile number').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const guideProfileSchema = z.object({
  shortBio: z.string().max(300, 'Short bio must be 300 characters or less').optional(),
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(1000, 'Bio must be 1000 characters or less').optional(),
  tagline: z.string().max(100).optional(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(100).optional(),
  stateId: z.string().optional(),
  cityId: z.string().optional(),
  experienceYears: z.number().min(0).max(60, 'Experience years cannot exceed 60'),
  maxAltitudeLed: z.number().min(0).max(9000, 'Altitude cannot exceed 9000m').optional(),
  education: z.string().optional(),
  certifications: z.array(z.string()),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  specializations: z.array(z.string()).min(1, 'At least one specialization required'),
  specializationProofs: z.array(z.object({
    specialization: z.string(),
    proofUrl: z.string(),
    description: z.string().optional(),
  })).optional(),
  basePricePerDay: z.number().min(100, 'Minimum price is ₹100/day'),
});

export const productSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  destinationId: z.string().min(1, 'Destination is required'),
  description: z.string().min(100, 'Description must be at least 100 characters'),
  shortDescription: z.string().max(200).optional(),
  highlights: z.array(z.string()),
  activityType: z.string(),
  difficultyLevel: z.string(),
  durationDays: z.number().min(1),
  durationNights: z.number().min(0),
  isPetFriendly: z.boolean().optional(),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
  thingsToCarry: z.array(z.string()),
  cancellationPolicy: z.array(z.object({
    hours: z.number(),
    refundPercent: z.number().min(0).max(100),
  })).optional(),
  itinerary: z.array(z.object({
    day: z.number(),
    title: z.string(),
    description: z.string(),
    meals: z.string().optional(),
    accommodation: z.string().optional(),
    distance: z.string().optional(),
    altitude: z.string().optional(),
  })),
});

export const fixedDepartureSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  startDate: z.string().min(1, 'Start date is required'),
  totalSeats: z.number().min(1, 'At least 1 seat required'),
  maxGroupSize: z.number().min(1).optional(),
  minGroupSize: z.number().min(1).optional(),
  genderPolicy: z.string().optional(),
  pricingTiers: z.object({
    privateRoom: z.number().min(0).optional(),
    doubleSharing: z.number().min(0).optional(),
    tripleSharing: z.number().min(0).optional(),
    quadSharing: z.number().min(0).optional(),
    dormBed: z.number().min(0).optional(),
  }).optional(),
  petPricing: z.object({
    personWithoutPet: z.number().min(0).optional(),
    personWithOnePet: z.number().min(0).optional(),
    perAdditionalPet: z.number().min(0).optional(),
  }).optional(),
  pricePerPerson: z.number().min(0).optional(),
  meetingPoint: z.string().optional(),
  endingPoint: z.string().optional(),
  meetingTime: z.string().optional(),
  notes: z.string().optional(),
});

export const bookingSchema = z.object({
  guideId: z.string().min(1),
  tripType: z.enum(['FIXED_DEPARTURE', 'PERSONAL_BOOKING']),
  fixedDepartureId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  numberOfGuests: z.number().min(1),
  specialRequests: z.string().optional(),
  guestDetails: z.array(z.object({
    name: z.string(),
    age: z.number(),
  })).optional(),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  overallRating: z.number().min(1).max(5),
  comment: z.string().optional(),
  knowledgeRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  valueForMoneyRating: z.number().min(1).max(5).optional(),
  safetyRating: z.number().min(1).max(5).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GuideProfileInput = z.infer<typeof guideProfileSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type FixedDepartureInput = z.infer<typeof fixedDepartureSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;

// ==========================================
// SELLER MASTER DATA VALIDATION SCHEMAS
// ==========================================

// Certification upload — validates at point of entry
export const certificationSchema = z.object({
  certType: z.string().min(1, 'Certification type is required'),
  issuingAuthority: z.string().min(1, 'Issuing authority is required'),
  certificateNumber: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  documentUrl: z.string().optional(),
}).refine((data) => {
  // Expiry date must be in the future at time of upload
  if (data.expiryDate) {
    return new Date(data.expiryDate) > new Date();
  }
  return true;
}, {
  message: 'Certification expiry date must be in the future. Expired certificates cannot be uploaded.',
  path: ['expiryDate'],
});

// KYC submission
export const kycSchema = z.object({
  aadhaarLast4: z.string().regex(/^\d{4}$/, 'Must be exactly 4 digits').optional(),
  aadhaarDocumentUrl: z.string().optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional(),
  panDocumentUrl: z.string().optional(),
  bankAccountNumber: z.string().min(8, 'Invalid account number').max(18).optional(),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code').optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
});

// Package pricing validation — prevents ₹5 instead of ₹5000
export const packagePricingSchema = z.object({
  label: z.string().min(1, 'Pricing label is required'),
  basePrice: z.number()
    .min(PRICING_LIMITS.MIN_PRICE_PER_PERSON, `Minimum price is ₹${PRICING_LIMITS.MIN_PRICE_PER_PERSON}`)
    .max(PRICING_LIMITS.MAX_PRICE_PER_PERSON, `Maximum price is ₹${PRICING_LIMITS.MAX_PRICE_PER_PERSON}`),
  startMonth: z.string().optional(),
  endMonth: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// Package discount validation
export const packageDiscountSchema = z.object({
  label: z.string().min(1, 'Discount label is required'),
  discountType: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.number().positive('Discount must be positive'),
  minGroupSize: z.number().int().positive().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
}).refine((data) => {
  if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['discountValue'],
});

// Enhanced product schema with structured description
export const enhancedProductSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  destinationId: z.string().min(1, 'Destination is required'),
  overview: z.string().min(50, 'Overview must be at least 50 characters').optional(),
  description: z.string().min(100, 'Description must be at least 100 characters'),
  whatsIncluded: z.array(z.string()).optional(),
  whatsNotIncluded: z.array(z.string()).optional(),
  whatToBring: z.array(z.string()).optional(),
  highlights: z.array(z.string()),
  activityType: z.string(),
  packageCategory: z.string(),
  difficultyLevel: z.string(),
  durationDays: z.number().int().positive('Duration must be a positive integer'),
  durationNights: z.number().int().min(0),
  minGroupSize: z.number().int().positive().optional(),
  maxGroupSize: z.number().int().positive().optional(),
  isPetFriendly: z.boolean().optional(),
  packageLanguages: z.array(z.string()).optional(),
  bestSeasonMonths: z.array(z.string()).optional(),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
  itinerary: z.array(z.object({
    day: z.number(),
    title: z.string(),
    description: z.string(),
    meals: z.string().optional(),
    accommodation: z.string().optional(),
    distance: z.string().optional(),
    altitude: z.string().optional(),
  })),
  cancellationPolicy: z.array(z.object({
    hours: z.number(),
    refundPercent: z.number().min(0).max(100),
  })).optional(),
}).refine((data) => {
  // Group size max must be >= min
  if (data.minGroupSize && data.maxGroupSize) {
    return data.maxGroupSize >= data.minGroupSize;
  }
  return true;
}, {
  message: 'Maximum group size must be greater than or equal to minimum',
  path: ['maxGroupSize'],
});

// Admin verification action
export const verificationActionSchema = z.object({
  guideId: z.string().min(1),
  action: z.enum(['VERIFY', 'SUSPEND', 'REJECT', 'REVERT_TO_REVIEW']),
  reason: z.string().min(1, 'Reason is required for verification actions'),
});

// Admin certification review
export const certificationReviewSchema = z.object({
  certificationId: z.string().min(1),
  action: z.enum(['VERIFY', 'REJECT']),
  reason: z.string().optional(),
});

// Admin KYC review
export const kycReviewSchema = z.object({
  guideId: z.string().min(1),
  action: z.enum(['VERIFY', 'REJECT']),
  reason: z.string().optional(),
  payoutEligible: z.boolean().optional(),
});

export type CertificationInput = z.infer<typeof certificationSchema>;
export type KycInput = z.infer<typeof kycSchema>;
export type PackagePricingInput = z.infer<typeof packagePricingSchema>;
export type PackageDiscountInput = z.infer<typeof packageDiscountSchema>;
export type EnhancedProductInput = z.infer<typeof enhancedProductSchema>;
export type VerificationActionInput = z.infer<typeof verificationActionSchema>;
export type CertificationReviewInput = z.infer<typeof certificationReviewSchema>;
export type KycReviewInput = z.infer<typeof kycReviewSchema>;
