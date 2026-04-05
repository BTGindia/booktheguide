// ─────────────────────────────────────────────────────────────
//  WordPress Page Content Helpers
// ─────────────────────────────────────────────────────────────
//
//  Provides helper functions to read content blocks from WordPress
//  pages with fallback to hardcoded defaults. This enables editing
//  all page content through WordPress admin while keeping the
//  site functional even if WordPress is unavailable.
//
//  Usage:
//    const wp = await getPageContent('home');
//    const title = wp.text('hero_title', 'Default Title');
//    const image = wp.image('hero_image', '/images/default.jpg');
//
// ─────────────────────────────────────────────────────────────

import type { WPPage, WPContentBlock, WPContentImage, WPReview, WPFaqItem, WPInternalLink, WPPageSection, WPStateHub, WPCategoryLanding, WPStateCategory, WPTrip } from './types';
import type { WPMediaItem } from './types';
import { getPageBySlug, getStateHub, getCategoryLanding, getStateCategory, getTrip } from './index';

export interface PageContent {
  /** Get a text/HTML content block by key. Returns fallback if not found. */
  text: (key: string, fallback: string) => string;
  /** Get a plain-text content block (strips HTML tags). Returns fallback if not found. */
  plainText: (key: string, fallback: string) => string;
  /** Get an image URL by key. Returns fallback URL if not found. */
  image: (key: string, fallback: string) => string;
  /** Get full image data (URL + alt) by key. */
  imageData: (key: string) => WPMediaItem | null;
  /** Get all reviews/testimonials. Returns fallback array if none in WordPress. */
  reviews: WPReview[] | null;
  /** Get gallery image URLs. Returns null if none. */
  galleryImages: WPMediaItem[] | null;
  /** Get FAQ items. */
  faqItems: WPFaqItem[] | null;
  /** Get internal links (SEO). */
  internalLinks: WPInternalLink[] | null;
  /** Get page sections. */
  sections: WPPageSection[] | null;
  /** Get SEO content block. */
  seoContentBlock: string | null;
  /** The raw WordPress page data (null if unavailable). */
  raw: WPPage | null;
}

/** Strip HTML tags for plain text usage */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Fetch a WordPress page by slug and return a helper object
 * for reading content blocks with fallbacks.
 */
export async function getPageContent(slug: string): Promise<PageContent> {
  const page = await getPageBySlug(slug);

  const blocksMap = new Map<string, string>();
  const imagesMap = new Map<string, WPMediaItem>();

  if (page?.pageFields?.contentBlocks) {
    for (const block of page.pageFields.contentBlocks) {
      if (block.blockKey) {
        blocksMap.set(block.blockKey, block.blockValue);
      }
    }
  }

  if (page?.pageFields?.contentImages) {
    for (const img of page.pageFields.contentImages) {
      if (img.imageKey && img.image) {
        imagesMap.set(img.imageKey, img.image);
      }
    }
  }

  return {
    text: (key: string, fallback: string) => {
      const val = blocksMap.get(key);
      return val && val.trim() ? val : fallback;
    },
    plainText: (key: string, fallback: string) => {
      const val = blocksMap.get(key);
      if (!val || !val.trim()) return fallback;
      return stripHtml(val);
    },
    image: (key: string, fallback: string) => {
      const img = imagesMap.get(key);
      return img?.sourceUrl || fallback;
    },
    imageData: (key: string) => {
      return imagesMap.get(key) || null;
    },
    reviews: page?.pageFields?.reviews || null,
    galleryImages: page?.pageFields?.galleryImages || null,
    faqItems: page?.pageFields?.faqItems || null,
    internalLinks: page?.pageFields?.internalLinks || null,
    sections: page?.pageFields?.sections || null,
    seoContentBlock: page?.pageFields?.seoContentBlock || null,
    raw: page,
  };
}

// ─────────────────────────────────────────────────────────────
//  State Hub Content Helpers
// ─────────────────────────────────────────────────────────────

export interface StateHubContent {
  /** Get a text/HTML content block by key. Returns fallback if not found. */
  text: (key: string, fallback: string) => string;
  /** Get a plain-text content block (strips HTML tags). Returns fallback if not found. */
  plainText: (key: string, fallback: string) => string;
  /** Get an image URL by key. Returns fallback URL if not found. */
  image: (key: string, fallback: string) => string;
  /** Get full image data (URL + alt) by key. */
  imageData: (key: string) => WPMediaItem | null;
  /** FAQ items from WordPress. */
  faqItems: WPFaqItem[] | null;
  /** Internal links for SEO. */
  internalLinks: WPInternalLink[] | null;
  /** SEO overview content. */
  overviewContent: string | null;
  /** Why Book a Guide content. */
  whyBookGuide: string | null;
  /** Travel Tips content. */
  travelTips: string | null;
  /** The raw WordPress state hub data (null if unavailable). */
  raw: WPStateHub | null;
}

/**
 * Fetch a WordPress State Hub by slug and return a helper object
 * for reading content blocks with fallbacks.
 */
export async function getStateHubContent(slug: string): Promise<StateHubContent> {
  const hub = await getStateHub(slug);

  const blocksMap = new Map<string, string>();
  const imagesMap = new Map<string, WPMediaItem>();

  if (hub?.stateHubFields?.contentBlocks) {
    for (const block of hub.stateHubFields.contentBlocks) {
      if (block.blockKey) {
        blocksMap.set(block.blockKey, block.blockValue);
      }
    }
  }

  if (hub?.stateHubFields?.contentImages) {
    for (const img of hub.stateHubFields.contentImages) {
      if (img.imageKey && img.image) {
        imagesMap.set(img.imageKey, img.image);
      }
    }
  }

  return {
    text: (key: string, fallback: string) => {
      const val = blocksMap.get(key);
      return val && val.trim() ? val : fallback;
    },
    plainText: (key: string, fallback: string) => {
      const val = blocksMap.get(key);
      if (!val || !val.trim()) return fallback;
      return stripHtml(val);
    },
    image: (key: string, fallback: string) => {
      const img = imagesMap.get(key);
      return img?.sourceUrl || fallback;
    },
    imageData: (key: string) => {
      return imagesMap.get(key) || null;
    },
    faqItems: hub?.stateHubFields?.faqItems || null,
    internalLinks: hub?.stateHubFields?.internalLinks || null,
    overviewContent: hub?.stateHubFields?.overviewContent || null,
    whyBookGuide: hub?.stateHubFields?.whyBookGuide || null,
    travelTips: hub?.stateHubFields?.travelTips || null,
    raw: hub,
  };
}

// ─────────────────────────────────────────────────────────────
//  Generic CPT Content Helper (CategoryLanding, StateCategory)
// ─────────────────────────────────────────────────────────────

export interface CptContent {
  text: (key: string, fallback: string) => string;
  plainText: (key: string, fallback: string) => string;
  image: (key: string, fallback: string) => string;
  imageData: (key: string) => WPMediaItem | null;
  faqItems: WPFaqItem[] | null;
  internalLinks: WPInternalLink[] | null;
  seoContentBlock: string | null;
  raw: WPCategoryLanding | WPStateCategory | null;
}

function buildCptContent(
  contentBlocks: WPContentBlock[] | null | undefined,
  contentImages: WPContentImage[] | null | undefined,
  faqItems: WPFaqItem[] | null | undefined,
  internalLinks: WPInternalLink[] | null | undefined,
  seoContentBlock: string | null | undefined,
  raw: WPCategoryLanding | WPStateCategory | null,
): CptContent {
  const blocksMap = new Map<string, string>();
  const imagesMap = new Map<string, WPMediaItem>();

  if (contentBlocks) {
    for (const block of contentBlocks) {
      if (block.blockKey) blocksMap.set(block.blockKey, block.blockValue);
    }
  }
  if (contentImages) {
    for (const img of contentImages) {
      if (img.imageKey && img.image) imagesMap.set(img.imageKey, img.image);
    }
  }

  return {
    text: (key, fallback) => {
      const val = blocksMap.get(key);
      return val && val.trim() ? val : fallback;
    },
    plainText: (key, fallback) => {
      const val = blocksMap.get(key);
      if (!val || !val.trim()) return fallback;
      return stripHtml(val);
    },
    image: (key, fallback) => imagesMap.get(key)?.sourceUrl || fallback,
    imageData: (key) => imagesMap.get(key) || null,
    faqItems: faqItems || null,
    internalLinks: internalLinks || null,
    seoContentBlock: seoContentBlock || null,
    raw,
  };
}

export async function getCategoryLandingContent(slug: string): Promise<CptContent> {
  const data = await getCategoryLanding(slug);
  const f = data?.categoryLandingFields;
  return buildCptContent(f?.contentBlocks, f?.contentImages, f?.faqItems, f?.internalLinks, f?.seoContentBlock, data);
}

export async function getStateCategoryContent(slug: string): Promise<CptContent> {
  const data = await getStateCategory(slug);
  const f = data?.stateCategoryFields;
  return buildCptContent(f?.contentBlocks, f?.contentImages, f?.faqItems, f?.internalLinks, f?.seoContentBlock, data);
}

// ─────────────────────────────────────────────────────────────
//  Trip Content Helpers
// ─────────────────────────────────────────────────────────────

export interface TripContent {
  text: (key: string, fallback: string) => string;
  plainText: (key: string, fallback: string) => string;
  image: (key: string, fallback: string) => string;
  imageData: (key: string) => WPMediaItem | null;
  faqItems: WPFaqItem[] | null;
  internalLinks: WPInternalLink[] | null;
  seoContentBlock: string | null;
  overview: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  heroDescription: string | null;
  raw: WPTrip | null;
}

export async function getTripContent(slug: string): Promise<TripContent> {
  const data = await getTrip(slug);
  const f = data?.tripFields;

  const blocksMap = new Map<string, string>();
  const imagesMap = new Map<string, WPMediaItem>();

  if (f?.contentBlocks) {
    for (const block of f.contentBlocks) {
      if (block.blockKey) blocksMap.set(block.blockKey, block.blockValue);
    }
  }
  if (f?.contentImages) {
    for (const img of f.contentImages) {
      if (img.imageKey && img.image) imagesMap.set(img.imageKey, img.image);
    }
  }

  return {
    text: (key, fallback) => {
      const val = blocksMap.get(key);
      return val && val.trim() ? val : fallback;
    },
    plainText: (key, fallback) => {
      const val = blocksMap.get(key);
      if (!val || !val.trim()) return fallback;
      return stripHtml(val);
    },
    image: (key, fallback) => imagesMap.get(key)?.sourceUrl || fallback,
    imageData: (key) => imagesMap.get(key) || null,
    faqItems: f?.faqItems || null,
    internalLinks: f?.internalLinks || null,
    seoContentBlock: f?.seoContentBlock || null,
    overview: f?.overview || null,
    seoTitle: f?.seoTitle || null,
    seoDescription: f?.seoDescription || null,
    heroDescription: f?.heroDescription || null,
    raw: data,
  };
}
