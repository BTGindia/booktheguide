// ==========================================
// CONTROLLED VOCABULARY / TAXONOMY
// ==========================================
// All multi-select fields MUST use values from these lists.
// Never allow free text for filterable/searchable fields.
// Define lists before launch. Guides select from them, never create new values.

// ==========================================
// CERTIFICATION TYPES
// ==========================================
export const CERTIFICATION_TYPES = [
  'Mountaineering Basic',
  'Mountaineering Advance',
  'Wilderness First Aid',
  'Wilderness First Responder',
  'Paragliding Pilot',
  'Paragliding Tandem Pilot',
  'Rafting Guide',
  'Rafting Instructor',
  'Skiing Instructor',
  'Rock Climbing Instructor',
  'Scuba Diving Instructor',
  'Wildlife Guide',
  'Heritage Walk Certification',
  'Adventure Tourism Facilitator',
  'First Aid & CPR',
  'High Altitude Medical Aid',
  'Search and Rescue',
  'Other',
] as const;

export type CertificationType = typeof CERTIFICATION_TYPES[number];

// ==========================================
// ISSUING AUTHORITIES
// ==========================================
export const ISSUING_AUTHORITIES = [
  'ITBP (Indo-Tibetan Border Police)',
  'NIM (Nehru Institute of Mountaineering)',
  'HMI (Himalayan Mountaineering Institute)',
  'IMF (Indian Mountaineering Foundation)',
  'NIMAS (National Institute of Mountaineering & Allied Sports)',
  'ABVIMAS (Atal Bihari Vajpayee Institute of Mountaineering)',
  'JIM (Jawahar Institute of Mountaineering)',
  'SASE (Snow & Avalanche Study Establishment)',
  'Indian Red Cross Society',
  'St. John Ambulance',
  'PADI',
  'SSI (Scuba Schools International)',
  'DGCA (Directorate General of Civil Aviation)',
  'Adventure Tour Operators Association of India',
  'State Tourism Board',
  'Other',
] as const;

export type IssuingAuthority = typeof ISSUING_AUTHORITIES[number];

// ==========================================
// LANGUAGES
// ==========================================
export const LANGUAGES = [
  'Hindi',
  'English',
  'Punjabi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Odia',
  'Assamese',
  'Urdu',
  'Nepali',
  'Kashmiri',
  'Dogri',
  'Konkani',
  'Manipuri',
  'Bodo',
  'Santali',
  'Maithili',
  'Sindhi',
  'Sanskrit',
  'Ladakhi',
  'Garhwali',
  'Kumaoni',
  'Pahari',
  'Tibetan',
  'French',
  'German',
  'Spanish',
  'Japanese',
  'Korean',
  'Mandarin',
] as const;

export type Language = typeof LANGUAGES[number];

// ==========================================
// GUIDE TYPES / SPECIALISATION TYPES
// ==========================================
export const GUIDE_TYPES = [
  { value: 'TREK_GUIDE', label: 'Trek Guide' },
  { value: 'ADVENTURE_SPORTS_GUIDE', label: 'Adventure Sports Guide' },
  { value: 'GROUP_TRIP_LEADER', label: 'Group Trip Leader' },
] as const;

// ==========================================
// SPECIALIZATIONS (controlled vocabulary)
// ==========================================
export const SPECIALIZATIONS = [
  'Trekking',
  'High Altitude Treks',
  'Day Treks',
  'Multi-day Treks',
  'Snow Treks',
  'Mountaineering Workshop',
  'City Tour',
  'Day Hikes',
  'Heritage Walk',
  'Pilgrimage/Cultural Tour',
  'Jungle Safari',
  'Culinary Tour',
  'Photography Workshop',
  'Art Workshop',
  'Paragliding',
  'Rafting',
  'Skiing',
  'Rock Climbing',
  'Bungee Jumping',
  'Pet Friendly Tours',
  'Offbeat Destinations',
  'Hidden Gems',
  'Village Stays',
  'Unexplored Trails',
  'Slow Travel',
] as const;

export type Specialization = typeof SPECIALIZATIONS[number];

// ==========================================
// DIFFICULTY LEVELS (controlled vocabulary)
// ==========================================
export const DIFFICULTY_LEVELS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'CHALLENGING', label: 'Challenging' },
  { value: 'EXPERT', label: 'Expert' },
] as const;

// ==========================================
// SEASONS / MONTHS
// ==========================================
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

// ==========================================
// PACKAGE CATEGORIES
// ==========================================
export const PACKAGE_CATEGORIES = [
  'TOURIST_GUIDES',
  'GROUP_TRIPS',
  'ADVENTURE_GUIDES',
  'HERITAGE_WALKS',
  'TRAVEL_WITH_INFLUENCERS',
  'OFFBEAT_TRAVEL',
  'TREKKING',
] as const;

// ==========================================
// GENDER OPTIONS
// ==========================================
export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

// ==========================================
// ID PROOF TYPES
// ==========================================
export const ID_PROOF_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
] as const;

// ==========================================
// GUIDE VERIFICATION STATUS (display labels)
// ==========================================
export const VERIFICATION_STATUS_LABELS: Record<string, { label: string; color: string; description: string }> = {
  UNVERIFIED: { label: 'Unverified', color: 'gray', description: 'Just signed up — complete your profile and submit for review' },
  IN_REVIEW: { label: 'In Review', color: 'yellow', description: 'Documents submitted — our team is reviewing your profile' },
  VERIFIED: { label: 'Verified', color: 'green', description: 'Your profile is verified and visible in search' },
  SUSPENDED: { label: 'Suspended', color: 'red', description: 'Your profile has been suspended — contact support' },
};

// ==========================================
// PRICING CONSTRAINTS
// ==========================================
export const PRICING_LIMITS = {
  MIN_PRICE_PER_PERSON: 100,    // ₹100 minimum
  MAX_PRICE_PER_PERSON: 500000, // ₹5,00,000 maximum
} as const;

// ==========================================
// PROFILE FIELD METADATA (ownership & validation)
// ==========================================
export const FIELD_OWNERSHIP: Record<string, 'GUIDE_OWNED' | 'JOINTLY_OWNED' | 'PLATFORM_OWNED'> = {
  // Guide-owned: edit anytime, changes go live
  displayName: 'GUIDE_OWNED',
  shortBio: 'GUIDE_OWNED',
  bio: 'GUIDE_OWNED',
  tagline: 'GUIDE_OWNED',
  coverImage: 'GUIDE_OWNED', // but media goes to review queue
  portfolioImages: 'GUIDE_OWNED', // but media goes to review queue

  // Jointly-owned: guide edits, triggers review flag
  languages: 'JOINTLY_OWNED',
  specializations: 'JOINTLY_OWNED',
  guideTypes: 'JOINTLY_OWNED',
  operatingRegions: 'JOINTLY_OWNED',
  operatingDestinations: 'JOINTLY_OWNED',

  // Platform-owned: only admin can write
  verificationStatus: 'PLATFORM_OWNED',
  isVerified: 'PLATFORM_OWNED',
  kycStatus: 'PLATFORM_OWNED',
  payoutEligible: 'PLATFORM_OWNED',
  legalName: 'PLATFORM_OWNED',
  guideScore: 'PLATFORM_OWNED',
};

// ==========================================
// RE-VERIFICATION TRIGGERS
// ==========================================
export const REVERIFICATION_TRIGGERS = {
  CERT_EXPIRY_ALERT_DAYS: [60, 30, 7],     // Days before cert expiry to send alerts
  INACTIVE_LOGIN_DAYS: 90,                   // Days without login triggers re-verification
  MAX_COMPLAINTS_30D: 2,                     // Complaints in 30 days triggers review
  ANNUAL_REVERIFICATION: true,               // Annual re-verification for all active guides
} as const;
