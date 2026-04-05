# Content Templates — Book The Guide

## Overview
These spreadsheets define the **section-by-section template and content requirements** for every page type on Book The Guide. The Content & SEO team should use these as a guide to populate actual content.

## Files

| # | File | Page Type | URL Pattern |
|---|------|-----------|-------------|
| 1 | `01_STATE_HUBS_TEMPLATE.csv` | State Hub Pages | `/explore/{state}` |
| 2 | `02_CATEGORY_LANDING_TEMPLATE.csv` | Category Landing Pages | `/experiences/{category}` |
| 3 | `03_STATE_CATEGORY_TEMPLATE.csv` | State + Category Pages | `/explore/{state}/{category}` |
| 4 | `04_GUIDE_PRODUCT_TEMPLATE.csv` | Guide Product / Trip Pages | `/trips/{slug}` |
| 5 | `05_BLOG_TEMPLATE.csv` | Blog Index + Article Pages | `/blog` and `/blog/{slug}` |
| 6 | `06_UTILITY_PAGES_TEMPLATE.csv` | About, Terms, Privacy, Contact | `/about`, `/terms`, `/privacy`, `/contact` |

## How to Use

1. **Open each CSV** in Google Sheets or Excel
2. Each row = one content field on the page
3. Columns explained:
   - **Section** — Which section of the page this field belongs to
   - **Field Name** — Name of the content field
   - **Character Limit** — Maximum recommended characters
   - **Content Type** — Text, Image URL, Link, Date, etc.
   - **SEO Importance** — Critical / High / Medium / Low
   - **Instructions** — How to write or format this field
   - **Example** — A concrete example (use as reference, don't copy verbatim)

4. **Priority**: Start with **Critical** and **High** SEO importance fields first
5. **Templated fields**: Fields with `{State}`, `{Category}`, `{Guide Name}` etc. should be filled per-page using the pattern shown

## States to Cover (Priority Order)

Primary states (launch first):
- Uttarakhand, Himachal Pradesh, Ladakh, Jammu & Kashmir, Rajasthan
- Delhi, Goa, Kerala, Karnataka, Tamil Nadu
- Meghalaya, Sikkim, Maharashtra, West Bengal

## Categories (5 total)

| Category | Slug |
|----------|------|
| Tourist Guides | `tourist-guides` |
| Group Trips | `group-trips` |
| Adventure Guides | `adventure-guides` |
| Heritage Walks | `heritage-walks` |
| Travel with Influencers | `travel-with-influencers` |

## Total Pages to Populate

| Page Type | Count | Formula |
|-----------|-------|---------|
| State Hubs | 14 | 1 per primary state |
| Category Landings | 5 | 1 per category |
| State + Category | 70 | 14 states × 5 categories |
| Guide Products | Variable | 1 per listed trip/guide |
| Blog Articles | 20+ target | Start with 2 per state |
| Utility Pages | 4 | About, Terms, Privacy, Contact |

## SEO Checklist per Page

- [ ] Page title under 60 characters with primary keyword
- [ ] Meta description under 155 characters with CTA
- [ ] Canonical URL set correctly
- [ ] OG image (1200×630) uploaded
- [ ] H1 contains primary keyword
- [ ] FAQ section with 4-6 questions (helps with Featured Snippets)
- [ ] Internal links to related pages (min 3)
- [ ] JSON-LD structured data fields filled

## Brand Voice Guidelines

- **Tone**: Warm, trustworthy, adventure-inspiring
- **Keywords to include naturally**: verified, local, authentic, curated, safe
- **Avoid**: Generic tourism jargon, excessive superlatives, unverified claims
- **Numbers**: Use specific stats where possible (e.g., "500+ verified guides" not "many guides")
