// ================================================================
// Package Categories — the 7 core experience types on BTG
// Maps each display category to underlying activityType values
// (Updated to match guide specializations)
// ================================================================

export const PACKAGE_CATEGORIES = [
  'TOURIST_GUIDES',
  'GROUP_TRIPS',
  'ADVENTURE_GUIDES',
  'HERITAGE_WALKS',
  'TRAVEL_WITH_INFLUENCERS',
  'OFFBEAT_TRAVEL',
  'TREKKING',
] as const;

export type PackageCategorySlug = (typeof PACKAGE_CATEGORIES)[number];

export interface CategoryDefinition {
  slug: PackageCategorySlug;
  label: string;
  /** URL-friendly slug for routing (e.g., 'tourist-guides') */
  urlSlug: string;
  /** Image shown on homepage experience cards */
  image: string;
  /** Search href used for "Explore" links */
  href: string;
  /** Activity types that belong to this category */
  activityTypes: string[];
  /** Short description for SEO / meta */
  description: string;
}

export const CATEGORY_MAP: Record<PackageCategorySlug, CategoryDefinition> = {
  TOURIST_GUIDES: {
    slug: 'TOURIST_GUIDES',
    urlSlug: 'tourist-guides',
    label: 'Tourist Guides',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80&fm=webp',
    href: '/experiences/tourist-guides',
    activityTypes: ['City Tour', 'Day Hikes', 'Culinary Tour', 'Photography Workshop', 'Art Workshop', 'Jungle Safari', 'Pet Friendly Tours'],
    description: 'Explore cities and tourist spots with expert local guides',
  },
  GROUP_TRIPS: {
    slug: 'GROUP_TRIPS',
    urlSlug: 'group-trips',
    label: 'Group Trips',
    image: 'https://images.unsplash.com/photo-1682686581030-7fa4ea2b96c3?w=800&q=80&fm=webp',
    href: '/experiences/group-trips',
    activityTypes: ['Mountaineering Workshop', 'Day Hikes', 'Paragliding', 'Rafting', 'Skiing', 'Jungle Safari'],
    description: 'Join group departures and travel with like-minded adventurers',
  },
  ADVENTURE_GUIDES: {
    slug: 'ADVENTURE_GUIDES',
    urlSlug: 'adventure-guides',
    label: 'Adventure Sports',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80&fm=webp',
    href: '/experiences/adventure-guides',
    activityTypes: ['Biking Tours', 'River Rafting', 'Paragliding', 'Rock Climbing', 'Mountaineering Workshops'],
    description: 'Raft, climb, paraglide and explore with certified adventure guides',
  },
  HERITAGE_WALKS: {
    slug: 'HERITAGE_WALKS',
    urlSlug: 'heritage-walks',
    label: 'Heritage Walks',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80&fm=webp',
    href: '/experiences/heritage-walks',
    activityTypes: ['Heritage Walk', 'Pilgrimage/Cultural Tour'],
    description: 'Walk through history — forts, temples, old cities and cultural trails',
  },
  TRAVEL_WITH_INFLUENCERS: {
    slug: 'TRAVEL_WITH_INFLUENCERS',
    urlSlug: 'travel-with-influencers',
    label: 'Travel with Influencers',
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800&q=80&fm=webp',
    href: '/experiences/travel-with-influencers',
    activityTypes: ['Photography Workshop', 'Culinary Tour', 'City Tour'],
    description: 'Travel alongside popular creators and influencers',
  },
  OFFBEAT_TRAVEL: {
    slug: 'OFFBEAT_TRAVEL',
    urlSlug: 'offbeat-travel',
    label: 'Offbeat Travel',
    image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&q=80&fm=webp',
    href: '/experiences/offbeat-travel',
    activityTypes: ['Offbeat Treks', 'Hidden Village (Stay & Tour)'],
    description: 'Discover unexplored destinations and hidden gems off the beaten path',
  },
  TREKKING: {
    slug: 'TREKKING',
    urlSlug: 'trekking',
    label: 'Trekking',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80&fm=webp',
    href: '/experiences/trekking',
    activityTypes: ['Beginner', 'Moderate', 'Advanced', 'Expeditions'],
    description: 'Trek through the Himalayas and beyond with expert trek leaders',
  },
};

/** Ordered list for display (homepage experience cards) */
export const CATEGORIES_ORDERED: CategoryDefinition[] = PACKAGE_CATEGORIES.map(
  (slug) => CATEGORY_MAP[slug],
);

/** Look up the display category for a given activityType + packageCategory field */
export function getCategoryForProduct(packageCategory?: string | null): CategoryDefinition {
  if (packageCategory && CATEGORY_MAP[packageCategory as PackageCategorySlug]) {
    return CATEGORY_MAP[packageCategory as PackageCategorySlug];
  }
  return CATEGORY_MAP.TOURIST_GUIDES; // default fallback
}

/** Get activity types for a category slug */
export function getActivityTypesForCategory(slug: PackageCategorySlug): string[] {
  return CATEGORY_MAP[slug]?.activityTypes ?? [];
}
