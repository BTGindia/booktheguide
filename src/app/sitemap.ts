// ─────────────────────────────────────────────────────────────
//  Dynamic XML Sitemap — Merges WordPress + DB content
// ─────────────────────────────────────────────────────────────

import { MetadataRoute } from 'next';
import { getAllStateSlugs } from '@/lib/states';
import { CATEGORIES_ORDERED } from '@/lib/categories';
import { getDisabledCategorySlugs } from '@/lib/active-packages';
import { getAllContentForSitemap } from '@/lib/wordpress';
import { LANDING_PAGES } from '@/lib/landing-pages';

const SITE_URL = 'https://www.booktheguide.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date().toISOString();

  // ── Static pages ──
  const staticPages = [
    { url: SITE_URL, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'monthly' as const, priority: 0.3 },
    { url: `${SITE_URL}/explore`, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${SITE_URL}/experiences`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${SITE_URL}/destinations`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${SITE_URL}/group-trips`, changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${SITE_URL}/trending`, changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${SITE_URL}/upcoming-trips`, changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${SITE_URL}/corporate-trip`, changeFrequency: 'monthly' as const, priority: 0.5 },
  ];
  entries.push(...staticPages.map((p) => ({ ...p, lastModified: now })));

  // ── State hub pages ──
  const stateSlugs = getAllStateSlugs();
  entries.push(
    ...stateSlugs.map((slug) => ({
      url: `${SITE_URL}/explore/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  );

  // ── Category landing pages (only enabled categories) ──
  const disabledSlugs = await getDisabledCategorySlugs();
  const activeCategories = CATEGORIES_ORDERED.filter(c => !disabledSlugs.has(c.slug));
  entries.push(
    ...activeCategories.map((cat) => ({
      url: `${SITE_URL}/experiences/${cat.urlSlug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  );

  // ── State × Category combo pages ──
  for (const slug of stateSlugs) {
    for (const cat of activeCategories) {
      entries.push({
        url: `${SITE_URL}/explore/${slug}/${cat.urlSlug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      });
    }
  }

  // ── WordPress content (blog posts, pages managed in CMS) ──
  const wpContent = await getAllContentForSitemap();

  // ── SEO Landing Pages ──
  for (const lp of LANDING_PAGES) {
    entries.push({
      url: `${SITE_URL}/${lp.region}/${lp.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    });
  }

  // Blog posts from WordPress
  for (const post of wpContent.posts) {
    entries.push({
      url: post.seo?.canonical || `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.modified || now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    });
  }

  return entries;
}
