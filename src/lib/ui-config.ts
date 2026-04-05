import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface UIConfig {
  sectionOrder: SectionOrderItem[];
  featuredItems: FeaturedItemConfig[];
  displaySettings: DisplaySettingConfig[];
}

export interface SectionOrderItem {
  sectionKey: string;
  visible: boolean;
  sortBy: string;
  limit: number;
}

export interface FeaturedItemConfig {
  section: string;
  itemId: string;
  position: number;
}

export interface DisplaySettingConfig {
  settingKey: string;
  settingValue: string;
}

const DEFAULT_UI_CONFIG: UIConfig = {
  sectionOrder: [],
  featuredItems: [],
  displaySettings: [],
};

/**
 * Fetch the UI Manager page config for a given page slug.
 * Falls back to empty config if none exists.
 */
export async function getUIConfig(pageSlug: string): Promise<UIConfig> {
  try {
    const config = await prisma.pageConfig.findUnique({
      where: { pageSlug },
    });

    if (!config) return DEFAULT_UI_CONFIG;

    const data = config.config as any;
    return {
      sectionOrder: Array.isArray(data?.sectionOrder) ? data.sectionOrder : [],
      featuredItems: Array.isArray(data?.featuredItems) ? data.featuredItems : [],
      displaySettings: Array.isArray(data?.displaySettings) ? data.displaySettings : [],
    };
  } catch {
    return DEFAULT_UI_CONFIG;
  }
}

/**
 * Check if a section is visible according to the UI config.
 * If no config entry for the section, defaults to visible.
 */
export function isSectionVisible(config: UIConfig, sectionKey: string): boolean {
  const entry = config.sectionOrder.find((s) => s.sectionKey === sectionKey);
  return entry ? entry.visible : true;
}

/**
 * Get the sort criteria for a section. Returns 'default' if not configured.
 */
export function getSectionSort(config: UIConfig, sectionKey: string): string {
  const entry = config.sectionOrder.find((s) => s.sectionKey === sectionKey);
  return entry?.sortBy || 'default';
}

/**
 * Get the item limit for a section. Returns the provided default if not configured.
 */
export function getSectionLimit(config: UIConfig, sectionKey: string, defaultLimit: number): number {
  const entry = config.sectionOrder.find((s) => s.sectionKey === sectionKey);
  return entry?.limit || defaultLimit;
}

/**
 * Get featured item IDs for a section, sorted by position.
 */
export function getFeaturedIds(config: UIConfig, sectionKey: string): string[] {
  return config.featuredItems
    .filter((f) => f.section === sectionKey)
    .sort((a, b) => a.position - b.position)
    .map((f) => f.itemId);
}

/**
 * Get a display setting value. Returns undefined if not configured.
 */
export function getDisplaySetting(config: UIConfig, settingKey: string): string | undefined {
  return config.displaySettings.find((d) => d.settingKey === settingKey)?.settingValue;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SortableItem = Record<string, any>;

/**
 * Apply UI Manager sorting to an array of products/items.
 * Supports: highest_booked, best_rated, newest, price_low, price_high, most_reviewed.
 */
export function applySorting<T extends SortableItem>(items: T[], sortBy: string): T[] {
  if (sortBy === 'default' || !sortBy) return items;

  const sorted = [...items];
  switch (sortBy) {
    case 'highest_booked':
      sorted.sort((a, b) => (b.totalBookings ?? 0) - (a.totalBookings ?? 0));
      break;
    case 'best_rated':
      sorted.sort((a, b) => (b.guide?.averageRating ?? b.averageRating ?? 0) - (a.guide?.averageRating ?? a.averageRating ?? 0));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      break;
    case 'price_low':
      sorted.sort((a, b) => (a.fixedDepartures?.[0]?.pricePerPerson ?? Infinity) - (b.fixedDepartures?.[0]?.pricePerPerson ?? Infinity));
      break;
    case 'price_high':
      sorted.sort((a, b) => (b.fixedDepartures?.[0]?.pricePerPerson ?? 0) - (a.fixedDepartures?.[0]?.pricePerPerson ?? 0));
      break;
    case 'most_reviewed':
      sorted.sort((a, b) => (b.guide?.totalReviews ?? b.totalReviews ?? 0) - (a.guide?.totalReviews ?? a.totalReviews ?? 0));
      break;
  }
  return sorted;
}

/**
 * Apply featured items: move pinned items to their specified positions.
 */
export function applyFeaturedPinning<T extends { id?: string; slug?: string }>(
  items: T[],
  featuredIds: string[]
): T[] {
  if (featuredIds.length === 0) return items;

  const pinned: T[] = [];
  const rest: T[] = [];

  for (const item of items) {
    const matchId = item.id || item.slug || '';
    if (featuredIds.includes(matchId)) {
      pinned.push(item);
    } else {
      rest.push(item);
    }
  }

  // Sort pinned by their position in featuredIds
  pinned.sort((a, b) => {
    const aIdx = featuredIds.indexOf(a.id || a.slug || '');
    const bIdx = featuredIds.indexOf(b.id || b.slug || '');
    return aIdx - bIdx;
  });

  return [...pinned, ...rest];
}
