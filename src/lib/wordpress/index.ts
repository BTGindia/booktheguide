// ─────────────────────────────────────────────────────────────
//  WordPress API — Public barrel export for Book The Guide
// ─────────────────────────────────────────────────────────────
//
//  Usage:
//    import { wp, wpSeoToMetadata, buildFaqSchema } from '@/lib/wordpress';
//
// ─────────────────────────────────────────────────────────────

import { wpQuery, wpQuerySafe } from './client';
import {
  GET_ALL_POSTS,
  GET_POST_BY_SLUG,
  GET_POSTS_BY_STATE,
  GET_ALL_POST_SLUGS,
  GET_PAGE_BY_SLUG,
  GET_STATE_HUB,
  GET_ALL_STATE_HUBS,
  GET_CATEGORY_LANDING,
  GET_ALL_CATEGORY_LANDINGS,
  GET_STATE_CATEGORY,
  GET_ALL_STATE_CATEGORIES,
  GET_GLOBAL_SEO,
  GET_ALL_CONTENT_FOR_SITEMAP,
  GET_TRIP_BY_SLUG,
  GET_ALL_TRIPS,
  GET_PAGE_CONFIG,
  GET_ALL_PAGE_CONFIGS,
} from './queries';
import type {
  WPPost,
  WPPage,
  WPStateHub,
  WPCategoryLanding,
  WPStateCategory,
  WPTrip,
  WPPageConfig,
  WPGlobalSeo,
  WPPageInfo,
  WPSitemapEntry,
} from './types';

// ── Re-exports ──
export * from './types';
export { wpSeoToMetadata, buildFaqSchema, buildArticleSchema, buildBreadcrumbSchema, getYoastRawSchema } from './seo';
export { getPageContent } from './content';
export type { PageContent } from './content';
export { getStateHubContent } from './content';
export type { StateHubContent } from './content';
export { getCategoryLandingContent, getStateCategoryContent } from './content';
export type { CptContent } from './content';
export { getTripContent } from './content';
export type { TripContent } from './content';

// ─────────────────────────────────────────────────────────────
//  Blog / Posts
// ─────────────────────────────────────────────────────────────

/** Fetch paginated blog posts, optionally filtered by WP category slug. */
export async function getPosts(options?: {
  first?: number;
  after?: string;
  categorySlug?: string;
}): Promise<{ posts: WPPost[]; pageInfo: WPPageInfo }> {
  const data = await wpQuerySafe<{
    posts: { nodes: WPPost[]; pageInfo: WPPageInfo };
  }>(GET_ALL_POSTS, {
    first: options?.first ?? 12,
    after: options?.after ?? null,
    categorySlug: options?.categorySlug ?? null,
  }, { tags: ['wp-posts'] });

  return {
    posts: data?.posts.nodes ?? [],
    pageInfo: data?.posts.pageInfo ?? {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
  };
}

/** Fetch a single blog post by slug. Returns null if not found. */
export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const data = await wpQuerySafe<{ post: WPPost | null }>(
    GET_POST_BY_SLUG,
    { slug },
    { tags: ['wp-posts', `wp-post-${slug}`] },
  );
  return data?.post ?? null;
}

/** Fetch blog posts filtered by state slug (ACF meta field). */
export async function getPostsByState(
  stateSlug: string,
  first = 12,
): Promise<WPPost[]> {
  const data = await wpQuerySafe<{
    posts: { nodes: WPPost[] };
  }>(GET_POSTS_BY_STATE, { stateSlug, first }, { tags: ['wp-posts', `wp-state-${stateSlug}`] });
  return data?.posts.nodes ?? [];
}

/** Fetch all post slugs for generateStaticParams. */
export async function getAllPostSlugs(): Promise<string[]> {
  const data = await wpQuerySafe<{
    posts: { nodes: { slug: string }[] };
  }>(GET_ALL_POST_SLUGS, {}, { tags: ['wp-posts'] });
  return data?.posts.nodes.map((n) => n.slug) ?? [];
}

// ─────────────────────────────────────────────────────────────
//  Pages (About, Terms, Privacy, Contact)
// ─────────────────────────────────────────────────────────────

/** Fetch a WordPress Page by its slug/URI. */
export async function getPageBySlug(slug: string): Promise<WPPage | null> {
  const data = await wpQuerySafe<{ page: WPPage | null }>(
    GET_PAGE_BY_SLUG,
    { slug },
    { tags: ['wp-pages', `wp-page-${slug}`] },
  );
  return data?.page ?? null;
}

// ─────────────────────────────────────────────────────────────
//  State Hub (Custom Post Type)
// ─────────────────────────────────────────────────────────────

/** Fetch state hub content by slug (e.g. "uttarakhand"). */
export async function getStateHub(slug: string): Promise<WPStateHub | null> {
  const data = await wpQuerySafe<{ stateHub: WPStateHub | null }>(
    GET_STATE_HUB,
    { slug },
    { tags: ['wp-state-hubs', `wp-state-hub-${slug}`] },
  );
  return data?.stateHub ?? null;
}

/** Fetch all state hub slugs for static generation. */
export async function getAllStateHubSlugs(): Promise<string[]> {
  const data = await wpQuerySafe<{
    stateHubs: { nodes: { slug: string; stateHubFields: { stateSlug: string } }[] };
  }>(GET_ALL_STATE_HUBS, {}, { tags: ['wp-state-hubs'] });
  return data?.stateHubs.nodes.map((n) => n.stateHubFields.stateSlug || n.slug) ?? [];
}

// ─────────────────────────────────────────────────────────────
//  Category Landing (Custom Post Type)
// ─────────────────────────────────────────────────────────────

/** Fetch category landing content by slug. */
export async function getCategoryLanding(slug: string): Promise<WPCategoryLanding | null> {
  const data = await wpQuerySafe<{ categoryLanding: WPCategoryLanding | null }>(
    GET_CATEGORY_LANDING,
    { slug },
    { tags: ['wp-category-landings', `wp-category-landing-${slug}`] },
  );
  return data?.categoryLanding ?? null;
}

/** Fetch all category landing slugs. */
export async function getAllCategoryLandingSlugs(): Promise<string[]> {
  const data = await wpQuerySafe<{
    categoryLandings: { nodes: { slug: string; categoryLandingFields: { categorySlug: string } }[] };
  }>(GET_ALL_CATEGORY_LANDINGS, {}, { tags: ['wp-category-landings'] });
  return data?.categoryLandings.nodes.map((n) => n.categoryLandingFields.categorySlug || n.slug) ?? [];
}

// ─────────────────────────────────────────────────────────────
//  State × Category Combo (Custom Post Type)
// ─────────────────────────────────────────────────────────────

/** Fetch state + category combo content. Slug format: "{state}-{category}". */
export async function getStateCategory(slug: string): Promise<WPStateCategory | null> {
  const data = await wpQuerySafe<{ stateCategory: WPStateCategory | null }>(
    GET_STATE_CATEGORY,
    { slug },
    { tags: ['wp-state-categories', `wp-state-category-${slug}`] },
  );
  return data?.stateCategory ?? null;
}

/** Fetch all state-category combination slugs. */
export async function getAllStateCategorySlugs(): Promise<
  { stateSlug: string; categorySlug: string }[]
> {
  const data = await wpQuerySafe<{
    stateCategories: {
      nodes: {
        slug: string;
        stateCategoryFields: { stateSlug: string; categorySlug: string };
      }[];
    };
  }>(GET_ALL_STATE_CATEGORIES, {}, { tags: ['wp-state-categories'] });

  return (
    data?.stateCategories.nodes.map((n) => ({
      stateSlug: n.stateCategoryFields.stateSlug,
      categorySlug: n.stateCategoryFields.categorySlug,
    })) ?? []
  );
}

// ─────────────────────────────────────────────────────────────
//  Global SEO Settings
// ─────────────────────────────────────────────────────────────

/** Fetch global Yoast SEO settings (schema, social profiles). */
export async function getGlobalSeo(): Promise<WPGlobalSeo | null> {
  const data = await wpQuerySafe<{ seo: WPGlobalSeo }>(
    GET_GLOBAL_SEO,
    {},
    { revalidate: 3600, tags: ['wp-global'] },
  );
  return data?.seo ?? null;
}

// ─────────────────────────────────────────────────────────────
//  Sitemap
// ─────────────────────────────────────────────────────────────

/** Fetch all published content URLs + modified dates for XML sitemap. */
export async function getAllContentForSitemap(): Promise<{
  posts: WPSitemapEntry[];
  pages: WPSitemapEntry[];
  stateHubs: WPSitemapEntry[];
  categoryLandings: WPSitemapEntry[];
  stateCategories: WPSitemapEntry[];
  trips: WPSitemapEntry[];
}> {
  const data = await wpQuerySafe<{
    posts: { nodes: WPSitemapEntry[] };
    pages: { nodes: WPSitemapEntry[] };
    stateHubs: { nodes: WPSitemapEntry[] };
    categoryLandings: { nodes: WPSitemapEntry[] };
    stateCategories: { nodes: WPSitemapEntry[] };
    btgTrips: { nodes: WPSitemapEntry[] };
  }>(GET_ALL_CONTENT_FOR_SITEMAP, {}, { revalidate: 3600 });

  return {
    posts: data?.posts.nodes ?? [],
    pages: data?.pages.nodes ?? [],
    stateHubs: data?.stateHubs.nodes ?? [],
    categoryLandings: data?.categoryLandings.nodes ?? [],
    stateCategories: data?.stateCategories.nodes ?? [],
    trips: data?.btgTrips?.nodes ?? [],
  };
}

// ─────────────────────────────────────────────────────────────
//  Trips (individual package/experience pages for SEO)
// ─────────────────────────────────────────────────────────────

/** Fetch trip content by slug (e.g. "coorg-coffee-trail"). */
export async function getTrip(slug: string): Promise<WPTrip | null> {
  const data = await wpQuerySafe<{ btgTrip: WPTrip | null }>(
    GET_TRIP_BY_SLUG,
    { slug },
    { tags: ['wp-trips', `wp-trip-${slug}`] },
  );
  return data?.btgTrip ?? null;
}

/** Fetch all trip slugs for static generation. */
export async function getAllTripSlugs(): Promise<string[]> {
  const data = await wpQuerySafe<{
    btgTrips: { nodes: { slug: string; tripFields: { tripSlug: string } }[] };
  }>(GET_ALL_TRIPS, {}, { tags: ['wp-trips'] });
  return data?.btgTrips.nodes.map((n) => n.tripFields.tripSlug || n.slug) ?? [];
}

// ─────────────────────────────────────────────────────────────
//  Page Config (UI Manager display settings)
// ─────────────────────────────────────────────────────────────

/** Fetch page config by slug (e.g. "home", "group-trips"). */
export async function getPageConfig(slug: string): Promise<WPPageConfig | null> {
  const data = await wpQuerySafe<{ pageConfig: WPPageConfig | null }>(
    GET_PAGE_CONFIG,
    { slug },
    { tags: ['wp-page-configs', `wp-page-config-${slug}`] },
  );
  return data?.pageConfig ?? null;
}

/** Fetch all page configs. */
export async function getAllPageConfigs(): Promise<WPPageConfig[]> {
  const data = await wpQuerySafe<{
    pageConfigs: { nodes: WPPageConfig[] };
  }>(GET_ALL_PAGE_CONFIGS, {}, { tags: ['wp-page-configs'] });
  return data?.pageConfigs.nodes ?? [];
}
