# Headless WordPress CMS — Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Book The Guide                                │
├─────────────────────┬───────────────────────────────────────────────┤
│   WordPress CMS     │          Next.js Frontend                      │
│  (Content + SEO)    │       (Rendering + Logic)                      │
├─────────────────────┼───────────────────────────────────────────────┤
│                     │                                                │
│  Blog Posts         │──→ /blog/{slug}                                │
│  State Hubs (CPT)   │──→ /explore/{state}                           │
│  Category Landings  │──→ /experiences/{category}                     │
│  State×Category     │──→ /explore/{state}/{category}                 │
│  Pages              │──→ /about, /terms, /privacy, /contact          │
│  Yoast SEO          │──→ Meta titles, descriptions, OG, schemas      │
│  ACF Fields         │──→ FAQs, internal links, content blocks        │
│                     │                                                │
│  ┌─────────────┐    │    ┌──────────────────┐                        │
│  │ WPGraphQL   │────┼───→│ src/lib/wordpress │                       │
│  │ endpoint    │    │    │ (client + queries)│                        │
│  └─────────────┘    │    └──────────────────┘                        │
│                     │                                                │
│  Webhook on         │    ┌──────────────────┐                        │
│  publish/update ────┼───→│/api/revalidate   │──→ ISR cache purge     │
│                     │    └──────────────────┘                        │
│                     │                                                │
│  Preview button ────┼───→│/api/preview      │──→ Draft mode          │
│                     │                                                │
├─────────────────────┤    ┌──────────────────┐                        │
│  DB-driven data     │    │ Prisma / PostgreSQL                       │
│  (NOT in WordPress) │    │ Products, Bookings, Users, Reviews        │
│                     │    │ Guides, Departures, Payments              │
│                     │    └──────────────────┘                        │
└─────────────────────┴───────────────────────────────────────────────┘
```

### What WordPress Manages (Content + SEO)
- **Blog posts** — articles, itineraries, travel guides
- **State hub editorial content** — long-form descriptions, FAQs, internal links
- **Category landing content** — experience descriptions, FAQs
- **State × category content** — combo page editorial
- **Utility pages** — About, Terms, Privacy, Contact content
- **All SEO metadata** — via Yoast SEO or RankMath plugin
- **Structured data / JSON-LD** — FAQ schema, article schema, breadcrumbs

### What Stays in PostgreSQL (Transactional Data)
- Users, guides, admin profiles
- Products, packages, fixed departures
- Bookings, payments, commissions
- Reviews, ratings
- Destinations, cities, states (operational data)
- AI query logs

---

## Step 1: WordPress Installation

### Option A: Managed WordPress Hosting (Recommended)
Use a managed provider for reliability. Budget options:
- **Cloudways** — $14/mo (DigitalOcean 1GB)
- **Kinsta** — $35/mo (optimized for headless)
- **WP Engine** — $20/mo (Atlas for headless)

### Option B: Self-hosted
```bash
# On an Ubuntu VPS
sudo apt update && sudo apt install nginx mysql-server php php-fpm php-mysql php-xml php-mbstring
# Download WordPress
cd /var/www
sudo wget https://wordpress.org/latest.tar.gz
sudo tar xzf latest.tar.gz
# Configure nginx + SSL via Let's Encrypt
```

### Recommended Subdomain
```
cms.booktheguide.com → WordPress admin
www.booktheguide.com → Next.js frontend
```

---

## Step 2: Required WordPress Plugins

Install these plugins (all free or included with ACF PRO):

| Plugin | Purpose | Required |
|--------|---------|----------|
| **WPGraphQL** | GraphQL API for WordPress | ✅ Yes |
| **WPGraphQL for ACF** | Exposes ACF fields to GraphQL | ✅ Yes |
| **WPGraphQL Yoast SEO** | Exposes Yoast SEO data to GraphQL | ✅ Yes |
| **Advanced Custom Fields PRO** | Custom fields for structured content | ✅ Yes |
| **Yoast SEO** (or RankMath) | SEO metadata management | ✅ Yes |
| **Application Passwords** | Auth for preview/draft access | ✅ Built-in (WP 5.6+) |
| **WP Webhooks** | Alternative webhook trigger (optional) | Optional |

### Install via WP CLI (if available):
```bash
wp plugin install wp-graphql --activate
wp plugin install wp-graphql-acf --activate  
wp plugin install add-wpgraphql-seo --activate
wp plugin install wordpress-seo --activate
# ACF PRO must be uploaded manually (paid plugin)
```

---

## Step 3: WordPress Theme Setup

Copy the functions.php file from this repo into your WordPress theme:

```
BTG/wordpress/theme/functions.php
```

This file registers:
- **3 Custom Post Types**: State Hub, Category Landing, State × Category
- **5 ACF Field Groups**: Blog fields, State Hub fields, Category Landing fields, State × Category fields, Page sections
- **Webhook trigger**: Fires on publish/update to revalidate Next.js cache
- **Preview redirect**: Points WP "Preview" button to Next.js preview endpoint
- **Headless mode**: Redirects WordPress frontend to Next.js

### Add to wp-config.php:
```php
// Book The Guide Headless Config
define('BTG_NEXT_URL', 'https://www.booktheguide.com');
define('BTG_REVALIDATION_SECRET', 'your-strong-random-secret-here');
define('BTG_PREVIEW_SECRET', 'another-strong-random-secret-here');

// Allow GraphQL introspection (disable in production if not needed)
define('GRAPHQL_DEBUG', false);
```

---

## Step 4: Next.js Environment Variables

Add to your `.env` file:

```env
# WordPress CMS
WORDPRESS_GRAPHQL_URL="https://cms.booktheguide.com/graphql"
WORDPRESS_AUTH_TOKEN=""
WORDPRESS_PREVIEW_SECRET="another-strong-random-secret-here"
REVALIDATION_SECRET="your-strong-random-secret-here"
```

### Generate Application Password (for draft access):
1. Go to WordPress Admin → Users → Your Profile
2. Scroll to "Application Passwords"
3. Enter name "BTG Next.js" → Generate
4. Copy the password → set as `WORDPRESS_AUTH_TOKEN`

---

## Step 5: Content Model Reference

### Blog Posts (native `post` type)

| Field | Type | Where | SEO Impact |
|-------|------|-------|------------|
| Title | text | WP title | Critical |
| Content | WYSIWYG | WP editor | Critical |
| Excerpt | text | WP excerpt | High |
| Featured Image | media | WP featured image | High |
| Categories | taxonomy | WP categories | Medium |
| Tags | taxonomy | WP tags | Medium |
| **Read Time** | text (ACF) | blogFields | Low |
| **State** | text (ACF) | blogFields | High |
| **Destination** | text (ACF) | blogFields | Medium |
| **Related Guide** | text (ACF) | blogFields | Medium |
| **Hero Image** | image (ACF) | blogFields | Medium |
| **FAQ Items** | repeater (ACF) | blogFields | Critical |

### State Hub Pages (CPT: `state_hub`)

| Field | Type | Where | SEO Impact |
|-------|------|-------|------------|
| Title | text | WP title | Critical |
| Content | WYSIWYG | WP editor | Critical |
| **State Slug** | text (ACF) | stateHubFields | Critical |
| **Tagline** | text (ACF) | stateHubFields | High |
| **Hero Description** | textarea (ACF) | stateHubFields | Critical |
| **Overview Content** | WYSIWYG (ACF) | stateHubFields | Critical |
| **FAQ Items** | repeater (ACF) | stateHubFields | Critical |
| **Internal Links** | repeater (ACF) | stateHubFields | High |
| **Why Book Guide** | WYSIWYG (ACF) | stateHubFields | Medium |

### Category Landing Pages (CPT: `category_landing`)

| Field | Type | Where | SEO Impact |
|-------|------|-------|------------|
| Title | text | WP title | Critical |
| **Category Slug** | text (ACF) | categoryLandingFields | Critical |
| **Tagline** | text (ACF) | categoryLandingFields | High |
| **Hero Description** | textarea (ACF) | categoryLandingFields | Critical |
| **Why This Experience** | WYSIWYG (ACF) | categoryLandingFields | High |
| **What to Expect** | WYSIWYG (ACF) | categoryLandingFields | Medium |
| **FAQ Items** | repeater (ACF) | categoryLandingFields | Critical |
| **SEO Content Block** | WYSIWYG (ACF) | categoryLandingFields | Critical |
| **Internal Links** | repeater (ACF) | categoryLandingFields | High |

---

## Step 6: Content Team Workflow

### Publishing Flow
```
1. Writer creates/edits content in WordPress
2. SEO specialist fills Yoast SEO fields (title, meta desc, focus keyword)
3. Editor reviews and clicks "Publish"
4. WordPress webhook fires → Next.js revalidates cached page
5. Updated page is live on the website within seconds
```

### SEO Workflow (via Yoast SEO)
```
For every piece of content:
├── Fill "Focus keyphrase" (primary keyword)
├── Optimize Title (< 60 chars, include keyword)
├── Optimize Meta Description (< 155 chars, include CTA)
├── Add FAQ section (ACF repeater → auto-generates FAQPage schema)
├── Add Internal Links (ACF repeater → builds SEO link equity)
├── Check Yoast readability score → green light
└── Check Yoast SEO score → green light
```

### Preview Flow
```
1. Writer edits a draft in WordPress
2. Clicks "Preview" button
3. Redirected to Next.js preview endpoint with secret
4. Next.js enters draft mode → fetches unpublished content via WPGraphQL
5. Writer sees exactly how the page will look before publishing
```

---

## Step 7: Content Creation Priorities

### Phase 1: Launch (14 State Hubs + 5 Category Pages)
1. Create 14 State Hub posts (one per primary state)
2. Create 5 Category Landing posts
3. Fill Yoast SEO for all 19 pages
4. Add FAQ sections (4-6 questions per page)
5. Add internal links between related pages

### Phase 2: Scale (70 Combo Pages + Blog)
1. Create 70 State × Category posts (14 states × 5 categories)
2. Publish first batch of blog posts (2 per primary state = 28 articles)
3. Fill Yoast SEO for all pages

### Phase 3: SEO Moat
1. Continuous blog publishing (target: 4 articles/week)
2. Update seasonal content (best time to visit, new itineraries)
3. Add new long-tail keyword pages based on Search Console data
4. Build topical clusters via internal linking

---

## Step 8: Verifying the Integration

### Test the GraphQL endpoint:
```bash
curl -X POST https://cms.booktheguide.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ generalSettings { title url } }"}'
```

### Test revalidation webhook:
```bash
curl -X POST https://www.booktheguide.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"your-secret","type":"state_hub","slug":"uttarakhand"}'
```

### Test preview mode:
```
https://www.booktheguide.com/api/preview?secret=your-preview-secret&slug=my-draft-post&type=post
```

---

## File Structure

```
src/lib/wordpress/
├── client.ts      → WPGraphQL fetch client (ISR caching, error handling)
├── queries.ts     → All GraphQL queries (posts, pages, CPTs, sitemap)
├── types.ts       → TypeScript types (WPPost, WPStateHub, WPSeo, etc.)
├── seo.ts         → Yoast SEO → Next.js Metadata converter
└── index.ts       → Public API (barrel export with helper functions)

src/components/wordpress/
└── WPContentBlocks.tsx → Reusable components (FAQ, SEO block, links, content)

src/app/api/
├── revalidate/route.ts → Webhook endpoint for WordPress ISR triggers
└── preview/route.ts    → WordPress draft preview mode handler

src/app/sitemap.ts      → Dynamic XML sitemap merging WP + DB content

wordpress/theme/
└── functions.php       → WordPress CPTs, ACF fields, webhooks, headless mode
```

---

## How It Works at Runtime

### Page Load Flow (e.g. `/explore/uttarakhand`)
```
1. Request hits Next.js
2. Next.js checks ISR cache (revalidate: 300s)
3. If cache miss or stale:
   a. Fetch WordPress "stateHub" by slug "uttarakhand" via WPGraphQL
   b. Fetch Prisma DB: products, guides, cities, bookings (transactional data)
   c. Merge: WP provides editorial copy + SEO; DB provides live product data
   d. Render page, cache result
4. Return HTML
```

### Content Update Flow
```
1. Editor updates state hub content in WordPress
2. WordPress fires webhook → POST /api/revalidate
3. Next.js purges ISR cache for that page
4. Next visitor gets freshly rendered page with updated content
```

### Fallback Behavior
If WordPress is not yet configured or a content piece doesn't exist:
- Page renders using **existing hardcoded content** from `src/lib/states.ts` and `src/lib/categories.ts`
- SEO metadata falls back to the **existing generateMetadata** implementations
- No errors, no broken pages — WordPress enhancement is purely additive

---

## Yoast SEO Best Practices for BTG

### Title Templates (set in Yoast → Search Appearance)
```
Posts:     %%title%% | Book The Guide Blog
Pages:    %%title%% | Book The Guide
State Hub: Explore %%title%% 2026 — Guides, Treks & Trips | Book The Guide
Category:  Best %%title%% in India 2026 | Book The Guide
```

### Social Media Defaults
```
OG Image: 1200 × 630px
Twitter: summary_large_image
```

### Schema Types per Content Type
```
Blog Posts:     Article schema (auto via Yoast)
State Hubs:     TouristDestination + FAQPage (auto via ACF FAQs)
Category:       ItemList + FAQPage
Pages:          WebPage
Homepage:       TravelAgency (already in layout.tsx)
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WPGraphQL not responding | Check plugin is active, permalink structure is set |
| ACF fields not in GraphQL | Install WPGraphQL for ACF, ensure "Show in GraphQL" is enabled in field group |
| Yoast SEO not in GraphQL | Install WPGraphQL Yoast SEO addon |
| Revalidation not working | Check REVALIDATION_SECRET matches in both .env and wp-config.php |
| Preview shows published page | Check WORDPRESS_AUTH_TOKEN is set (Application Password) |
| Images not loading | WordPress domain already allowed via `hostname: '**'` in next.config.js |
| Cache not clearing | Use `revalidateTag()` — verify tags match between queries.ts and route.ts |
