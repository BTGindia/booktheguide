# WordPress CMS Integration — Chat History & Change Log

> This file tracks all changes made during the WordPress CMS integration for Book The Guide.
> Last updated: **March 9, 2026**

---

## Table of Contents

1. [Objective](#objective)
2. [Session 1 — Initial Integration (March 8, 2026)](#session-1--initial-integration-march-8-2026)
3. [Session 2 — Bug Fixes & Seeding Script (March 8, 2026)](#session-2--bug-fixes--seeding-script-march-8-2026)
4. [Session 3 — Final Fixes, Seeding Execution & Completion (March 9, 2026)](#session-3--final-fixes-seeding-execution--completion-march-9-2026)
5. [Files Modified](#files-modified)
6. [Files Created](#files-created)
7. [WordPress Content Summary](#wordpress-content-summary)
8. [Architecture Overview](#architecture-overview)
9. [How to Re-Seed WordPress](#how-to-re-seed-wordpress)
10. [Next Steps for SEO Team](#next-steps-for-seo-team)

---

## Objective

**Goal:** Make all public-facing/unauthenticated pages on Book The Guide visible and manageable in WordPress CMS so the digital marketing/SEO team can:
- Edit page titles, meta descriptions, and OpenGraph data via Yoast SEO
- Add FAQ sections, SEO content blocks, and internal links via ACF fields
- Manage content for all state hub pages, category landing pages, and state×category combo pages
- Preview changes before publishing

**Pages covered:** Homepage, About, Contact, Terms, Privacy, Blog, Explore (main + state + state/category), Experiences (main + category), Destinations, Guides, Group Trips, Trending, Upcoming Trips, Corporate Trip, Search, Inspiration, Wishlist.

---

## Session 1 — Initial Integration (March 8, 2026)

### What was done:

#### 1. Reviewed Existing WordPress Infrastructure
- Analyzed the full codebase: WordPress client, queries, types, SEO helpers, theme functions
- Found that only `explore/[state]` was connected to WordPress; all other pages were hardcoded
- Reviewed all 18+ public-facing pages for data sources and metadata patterns

#### 2. Updated `wordpress/theme/functions.php`
- Expanded Page ACF field group: added `faq_items`, `seo_content_block`, `internal_links` fields
- Updated `BTGPageFields` GraphQL type to include the new fields
- Updated Page resolver to use `$resolve_faq` and `$resolve_links` helpers

#### 3. Updated WordPress TypeScript Types (`src/lib/wordpress/types.ts`)
- `WPPageFields` interface expanded with `faqItems`, `seoContentBlock`, `internalLinks`

#### 4. Updated WordPress Queries (`src/lib/wordpress/queries.ts`)
- `GET_PAGE_BY_SLUG` query now includes `faqItems { question answer }`, `seoContentBlock`, `internalLinks { label url description }`

#### 5. Updated 15 Page Files with WordPress Metadata Integration
Each page was updated to:
- Switch from static `metadata` export to async `generateMetadata()` function
- Fetch WordPress page by slug using `getPageBySlug()`
- If WordPress has Yoast SEO data, use `wpSeoToMetadata()` to convert it
- Fall back to existing hardcoded metadata if WordPress data isn't available

Pages updated:
| Page | Slug in WordPress | WP Content Sections |
|------|-------------------|---------------------|
| Homepage (`src/app/page.tsx`) | `home` | Metadata only |
| About (`src/app/about/page.tsx`) | `about` | PageSections, SeoContentBlock, FaqSection, InternalLinks |
| Contact (`src/app/contact/page.tsx`) | `contact` | PageSections, SeoContentBlock, FaqSection, InternalLinks |
| Terms (`src/app/terms/page.tsx`) | `terms` | SeoContentBlock |
| Privacy (`src/app/privacy/page.tsx`) | `privacy` | SeoContentBlock |
| Explore (`src/app/explore/page.tsx`) | `explore` | SeoContentBlock, FaqSection, InternalLinks |
| Experiences (`src/app/experiences/page.tsx`) | `experiences` | SeoContentBlock, FaqSection, InternalLinks |
| Destinations (`src/app/destinations/page.tsx`) | `destinations` | SeoContentBlock, FaqSection, InternalLinks |
| Guides (`src/app/guides/page.tsx`) | `guides` | SeoContentBlock, FaqSection, InternalLinks |
| Blog (`src/app/blog/page.tsx`) | `blog` | SeoContentBlock, FaqSection, InternalLinks |
| Group Trips (`src/app/group-trips/page.tsx`) | `group-trips` | SeoContentBlock, FaqSection, InternalLinks |
| Trending (`src/app/trending/page.tsx`) | `trending` | Metadata only |
| Upcoming Trips (`src/app/upcoming-trips/page.tsx`) | `upcoming-trips` | Metadata only |
| Search (`src/app/search/page.tsx`) | `search` | Metadata only |
| Inspiration (`src/app/inspiration/page.tsx`) | `inspiration` | Metadata only |

#### 6. Created `src/app/corporate-trip/layout.tsx`
- Corporate Trip page is a client component (`'use client'`) — can't export `generateMetadata` from it
- Created a separate layout.tsx in the same route to handle server-side metadata from WordPress

---

## Session 2 — Bug Fixes & Seeding Script (March 8, 2026)

### What was done:

#### 1. Updated `src/app/experiences/[category]/page.tsx`
- Added WordPress `getCategoryLanding()` integration for metadata
- If WordPress has Yoast SEO data for the category landing, use it; otherwise fall back to hardcoded metadata
- Added `wpCategoryLanding` fetch in the component's `Promise.all` data loading
- Added WP content sections (SeoContentBlock, FaqSection, InternalLinks) at the bottom of the page

#### 2. Updated `src/app/explore/[state]/[category]/page.tsx`
- Added WordPress `getStateCategory()` integration for metadata
- If WordPress has Yoast SEO data for the state×category combo, use it; otherwise fall back to hardcoded metadata
- Added `wpStateCategory` fetch in the component's `Promise.all` data loading
- Added WP content sections (SeoContentBlock, FaqSection, InternalLinks) before JSON-LD schemas

#### 3. Updated `src/app/api/revalidate/route.ts`
- Added `page` type handling to the revalidation handler
- Created `pagePathMap` mapping WordPress page slugs to Next.js routes (home→/, about→/about, etc.)
- Handles all 17 WordPress page slugs correctly

#### 4. Created `scripts/seed-wordpress.ts`
- Complete seeding script using WordPress REST API
- Creates 17 WordPress Pages, 33 State Hubs, 5 Category Landings, 50 State×Category Combos
- Supports upsert (create or update) so it's safe to run multiple times
- Sets ACF meta fields (state_slug, category_slug, tagline, hero_description, FAQ items, internal links)
- Sets Yoast SEO meta (title, meta description) where possible

---

## Session 3 — Final Fixes, Seeding Execution & Completion (March 9, 2026)

### What was done:

#### 1. Fixed TypeScript Compile Errors
All errors from previous sessions were resolved:

| File | Error | Fix |
|------|-------|-----|
| `experiences/[category]/page.tsx` | `wpSeoToMetadata` received string instead of object | Changed to `wpSeoToMetadata(seo, { title, description, url })` |
| `experiences/[category]/page.tsx` | Destructuring order wrong in Promise.all | Swapped `statesWithProducts` and `wpCategoryLanding` to match array order |
| `experiences/[category]/page.tsx` | `WPSeoContentBlock html=` prop doesn't exist | Changed to `content=` |
| `experiences/[category]/page.tsx` | `WPFaqSection items=` prop doesn't exist | Changed to `faqs=` |
| `explore/[state]/[category]/page.tsx` | Same `wpSeoToMetadata` string error | Same fix — pass object |
| `explore/[state]/[category]/page.tsx` | Same `html=` and `items=` prop errors | Changed to `content=` and `faqs=` |

#### 2. WordPress Setup — Application Password
- Discovered WordPress admin user: `btgindia` (btgindiaofficial@gmail.com)
- Created Application Password via WP-CLI: `docker exec btg-wordpress-1 wp user application-password create 1 "BTG Seed Script" --porcelain --allow-root`
- Password: `NxiENJ6Voyillo4wC2BhPqlQ`

#### 3. Updated `.env` File
Added three new environment variables:
```
WORDPRESS_URL="http://localhost:8000"
WORDPRESS_USERNAME="btgindia"
WORDPRESS_APP_PASSWORD="NxiENJ6Voyillo4wC2BhPqlQ"
```

#### 4. Installed `dotenv` Dependency
```
npm install --save-dev dotenv
```

#### 5. Ran Seeding Script Successfully
```
npx tsx scripts/seed-wordpress.ts
```

**Result: 105 entries created in WordPress:**
- 17 WordPress Pages
- 33 State Hubs
- 5 Category Landings
- 50 State × Category Combos (10 primary states × 5 categories)

All entries are now visible in WordPress admin at http://localhost:8000/wp-admin

---

## Files Modified

| File | Changes |
|------|---------|
| `wordpress/theme/functions.php` | Added FAQ, SEO content block, internal links to Page ACF fields; updated GraphQL types and resolvers |
| `src/lib/wordpress/types.ts` | Expanded `WPPageFields` with `faqItems`, `seoContentBlock`, `internalLinks` |
| `src/lib/wordpress/queries.ts` | Updated `GET_PAGE_BY_SLUG` query with new fields |
| `src/app/page.tsx` | Added `generateMetadata()` with WordPress fallback |
| `src/app/about/page.tsx` | WordPress metadata + WP content sections |
| `src/app/contact/page.tsx` | WordPress metadata + WP content sections |
| `src/app/terms/page.tsx` | WordPress metadata + WP SEO content block |
| `src/app/privacy/page.tsx` | WordPress metadata + WP SEO content block |
| `src/app/explore/page.tsx` | WordPress metadata + WP content sections |
| `src/app/experiences/page.tsx` | WordPress metadata + WP content sections |
| `src/app/experiences/[category]/page.tsx` | WordPress `getCategoryLanding` metadata + WP content sections |
| `src/app/destinations/page.tsx` | WordPress metadata + WP content sections |
| `src/app/guides/page.tsx` | WordPress metadata + WP content sections |
| `src/app/blog/page.tsx` | WordPress metadata + WP content sections |
| `src/app/group-trips/page.tsx` | WordPress metadata + WP content sections |
| `src/app/trending/page.tsx` | WordPress metadata |
| `src/app/upcoming-trips/page.tsx` | WordPress metadata |
| `src/app/search/page.tsx` | WordPress metadata |
| `src/app/inspiration/page.tsx` | WordPress metadata |
| `src/app/explore/[state]/[category]/page.tsx` | WordPress `getStateCategory` metadata + WP content sections |
| `src/app/api/revalidate/route.ts` | Added `page` type revalidation with slug→path mapping |
| `.env` | Added `WORDPRESS_URL`, `WORDPRESS_USERNAME`, `WORDPRESS_APP_PASSWORD` |

## Files Created

| File | Purpose |
|------|---------|
| `src/app/corporate-trip/layout.tsx` | Server-side metadata for client component page |
| `scripts/seed-wordpress.ts` | WordPress content seeding script (REST API) |
| `WORDPRESS_INTEGRATION_LOG.md` | This file — chat history and change log |

---

## WordPress Content Summary

### Pages (17)
`home`, `about`, `contact`, `terms`, `privacy`, `blog`, `explore`, `experiences`, `destinations`, `guides`, `group-trips`, `trending`, `upcoming-trips`, `corporate-trip`, `search`, `inspiration`, `wishlist`

### State Hubs (33)
All Indian states: `himachal-pradesh`, `uttarakhand`, `rajasthan`, `ladakh`, `kashmir`, `delhi`, `uttar-pradesh`, `goa`, `kerala`, `karnataka`, `tamil-nadu`, `maharashtra`, `west-bengal`, `punjab`, `meghalaya`, `sikkim`, `assam`, `madhya-pradesh`, `gujarat`, `odisha`, `andhra-pradesh`, `telangana`, `arunachal-pradesh`, `nagaland`, `chhattisgarh`, `jharkhand`, `bihar`, `haryana`, `manipur`, `mizoram`, `tripura`, `andaman-nicobar`, `lakshadweep`

### Category Landings (5)
`tourist-guides`, `group-trips`, `adventure-guides`, `heritage-walks`, `travel-with-influencers`

### State × Category Combos (50)
10 primary states × 5 categories. Primary states: Himachal Pradesh, Uttarakhand, Rajasthan, Ladakh, Kashmir, Delhi, Uttar Pradesh, Goa, Kerala, Karnataka.

---

## Architecture Overview

```
┌──────────────────────────────────┐
│     WordPress CMS (Headless)     │
│  http://localhost:8000/wp-admin  │
│                                  │
│  • Yoast SEO → meta titles/desc │
│  • ACF PRO → custom fields      │
│  • WPGraphQL → API endpoint     │
│  • Pages, State Hubs, Category  │
│    Landings, State×Category     │
└──────────────┬───────────────────┘
               │ WPGraphQL
               ▼
┌──────────────────────────────────┐
│      Next.js App (Frontend)      │
│  http://localhost:3000           │
│                                  │
│  generateMetadata() →            │
│    1. Try WordPress (wpPage)     │
│    2. Fall back to hardcoded     │
│                                  │
│  Page Content →                  │
│    • Prisma (dynamic data)       │
│    • WordPress (SEO content)     │
│                                  │
│  ISR: revalidate on WP publish   │
└──────────────────────────────────┘
```

**Data flow for each page:**
1. `generateMetadata()` calls `getPageBySlug('slug')` / `getCategoryLanding('slug')` / `getStateCategory('slug')`
2. If WordPress has Yoast SEO data → `wpSeoToMetadata(seo, defaults)` converts to Next.js Metadata
3. If WordPress has no data → falls back to hardcoded metadata (always works)
4. Page component fetches WP content and renders `WPSeoContentBlock`, `WPFaqSection`, `WPInternalLinksGrid` at the bottom
5. When WordPress content is updated, webhook hits `/api/revalidate` → Next.js purges ISR cache

---

## How to Re-Seed WordPress

If you need to re-run the seeding script (safe — it updates existing entries):

```bash
npx tsx scripts/seed-wordpress.ts
```

**Prerequisites:**
- Docker containers running: `docker-compose up -d`
- `.env` has `WORDPRESS_URL`, `WORDPRESS_USERNAME`, `WORDPRESS_APP_PASSWORD`
- WordPress theme with CPTs active (functions.php loaded)

---

## Next Steps for SEO Team

1. **Open WordPress Admin** → http://localhost:8000/wp-admin (login: btgindia)
2. **Install & Configure Yoast SEO** → edit meta titles and descriptions for each page
3. **Edit ACF Fields** → add FAQ items, SEO content blocks, internal links
4. **Preview Changes** → use WordPress Preview button (routes to Next.js preview endpoint)
5. **Publish** → webhook automatically revalidates the Next.js cached page

### WordPress Admin Navigation:
- **Posts** → Blog articles
- **Pages** → Static pages (Home, About, Contact, Terms, Privacy, etc.)
- **State Hubs** → /explore/{state} pages
- **Category Landings** → /experiences/{category} pages
- **State × Category** → /explore/{state}/{category} pages
