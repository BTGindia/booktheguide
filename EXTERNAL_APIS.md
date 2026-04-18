# External APIs Used — Book The Guide

## Active External APIs

### 1. Google Generative AI (Gemini)
- **Purpose**: NEEV AI Travel Planner chatbot
- **Endpoint**: `generativelanguage.googleapis.com`
- **Model**: `gemini-1.5-flash`
- **Auth**: `GEMINI_API_KEY` environment variable
- **File**: `src/app/api/neev/route.ts`
- **Rate Limited**: Yes (via `src/lib/rate-limit.ts`)
- **Caching**: No (conversational, per-request)

### 2. WordPress GraphQL API
- **Purpose**: CMS content — blog posts, FAQs, SEO content blocks, page content
- **Endpoint**: `WORDPRESS_GRAPHQL_URL` env var (e.g., `https://cms.booktheguide.com/graphql`)
- **Auth**: Optional `WORDPRESS_AUTH_TOKEN` bearer token
- **Files**: `src/lib/wordpress/client.ts`, `src/lib/wordpress/*.ts`
- **Caching**: ISR with 5-minute revalidation + cache tags for on-demand revalidation
- **Features**: Blog posts, page SEO, FAQs, internal links, reviews

### 3. Postal Pincode API (India)
- **Purpose**: Address auto-fill from Indian postal codes (guide registration)
- **Endpoint**: `https://api.postalpincode.in/pincode/{pincode}`
- **Auth**: None (public API), but endpoint requires NextAuth session
- **File**: `src/app/api/geography/pincode/route.ts`
- **Caching**: 24 hours (`revalidate: 86400`)
- **Rate Limited**: No (relies on session auth)

### 4. Google Fonts
- **Purpose**: Typography — ADLaM Display + Plus Jakarta Sans
- **Endpoint**: `https://fonts.googleapis.com/css2?...`
- **Auth**: None (public CDN)
- **File**: `src/app/layout.tsx`
- **Loaded**: Via `<link rel="preload">` + `<link rel="stylesheet">`

---

## Configured in CSP but Not Yet Active in Code

### 5. Google Analytics / Google Tag Manager
- **Purpose**: Website analytics and tracking
- **Endpoints**: `https://www.google-analytics.com`, `https://www.googletagmanager.com`
- **Status**: CSP headers allow these domains; no GA/GTM script tags found in codebase yet
- **File**: `next.config.js` (CSP headers)

---

## Configured in `.env` but Not Yet Integrated

### 6. Razorpay (Payment Gateway)
- **Purpose**: Online payments for bookings
- **Env Vars**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- **Status**: Environment variables defined but no integration code found

### 7. Cloudinary (Image CDN)
- **Purpose**: Image hosting and optimization
- **Env Vars**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Status**: Environment variables defined but no integration code found

---

## Internal APIs (Database-backed, no external calls)

| Route | Purpose |
|-------|---------|
| `POST /api/auth/[...nextauth]` | Authentication (NextAuth.js + Prisma + JWT) |
| `POST /api/auth/register` | User registration |
| `GET /api/navigation` | Dynamic nav menu data |
| `GET /api/active-config` | Active categories & states |
| `GET /api/destinations/suggest` | Search autocomplete |
| `POST /api/bookings` | Booking management |
| `GET /api/guide/*` | Guide profile & dashboard APIs |
| `GET /api/admin/*` | Admin dashboard APIs |
| `GET /api/super-admin/*` | Super admin APIs |
| `POST /api/upload` | File uploads (local storage) |
| `GET /api/ui-manager/*` | UI config & content management |

---

## Summary

| API | Type | Auth Required | Cached | Rate Limited |
|-----|------|--------------|--------|-------------|
| Google Gemini AI | AI/ML | API Key | No | Yes |
| WordPress GraphQL | CMS | Bearer Token | 5 min ISR | No |
| Postal Pincode | Geocoding | Public | 24 hours | No |
| Google Fonts | CDN | None | Browser | N/A |
| Google Analytics | Analytics | None | N/A | N/A |
| Razorpay | Payments | API Key | N/A | Not yet active |
| Cloudinary | Images | API Key | N/A | Not yet active |
