# WordPress Content Blocks Reference

This document lists every content block key used across all landing pages. WordPress editors can override any of these values by creating content blocks in the WordPress admin (Pages → Edit → Page Sections → Content Blocks).

## How It Works

Each page fetches content from WordPress using page slugs. In the WordPress admin:

1. **Navigate to Pages** → find the page by slug (e.g., "home", "about", "destinations")
2. **Scroll to "Page Sections"** → expand "Content Blocks"
3. **Add a row** with:
   - **Block Key**: The exact key from this document (e.g., `hero_title`)
   - **Block Value**: Your custom HTML/text content
4. **For images**: Use the "Content Images" repeater with an **Image Key** and uploaded image
5. **Publish/Update** the page — the site will revalidate automatically

If no WordPress value exists for a key, the fallback (default) value is used, so the site never breaks.

---

## Homepage (slug: `home`)

### Text Content Blocks

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_subtitle` | India's Premier Guide Booking Platform | Plain text |
| `hero_title` | India through the \<br /\>\<span class="uppercase text-[#58bdae]"\>EYES OF EXPERTS\</span\> | HTML with styled span |
| `marquee_text` | 10% DISCOUNT ON FIRST BOOKING – USE CODE BTG10 | Announcement bar |
| `how_it_works_label` | How It Works | Section label |
| `how_it_works_title` | Travel \<em\>Simplified\</em\> | Section heading |
| `feature_1_label` | Search | Step 1 label |
| `feature_1_title` | Find Your Perfect Journey | Step 1 heading |
| `feature_1_desc` | Choose your preferred destination, experience type and when you wish to travel. | Step 1 description |
| `feature_2_label` | Compare & Choose | Step 2 label |
| `feature_2_title` | Pick Your Ideal Guide | Step 2 heading |
| `feature_2_desc` | Browse verified guides and trip leaders with detailed profiles, ratings... | Step 2 description |
| `feature_3_label` | Book & Go! | Step 3 label |
| `feature_3_title` | Start Your Adventure | Step 3 heading |
| `feature_3_desc` | Join fixed departures with fellow travellers or book a private guide... | Step 3 description |
| `categories_label` | Explore Categories | Section label |
| `categories_title` | Experiences led by Verified Experts | Section heading |
| `categories_subtitle` | Select how you wish to see India | Section subtitle |
| `cat_tourist_guides_desc` | Hire a verified local guide for personalised sightseeing tours. | Category card |
| `cat_group_trips_desc` | Join fixed-date group departures with fellow travellers. | Category card |
| `cat_adventure_guides_desc` | Trek, raft, climb and explore with certified adventure specialists. | Category card |
| `cat_heritage_walks_desc` | Walk through India's rich history with storytellers. | Category card |
| `cat_influencers_desc` | Travel alongside popular creators on curated experiences. | Category card |

### Image Content Blocks

| Key | Default | Notes |
|-----|---------|-------|
| `hero_image` | /images/btg/hero-banner.png | Hero background image |

### Special Blocks
- **Reviews**: Uses the "Reviews" repeater (name, location, rating, text, trip, avatar)
- **Gallery Images**: Uses the "Gallery Images" field

---

## About (slug: `about`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_label` | Our Story | Section label |
| `stat_1_number` | 500+ | Stat counter |
| `stat_1_label` | Verified Guides | Stat label |
| `stat_2_number` | 50+ | Stat counter |
| `stat_2_label` | Destinations | Stat label |
| `stat_3_number` | 10,000+ | Stat counter |
| `stat_3_label` | Happy Travellers | Stat label |
| `stat_4_number` | 4.8 | Stat counter |
| `stat_4_label` | Average Rating | Stat label |
| `value_1_title` | Safety First | Value prop heading |
| `value_1_desc` | Every guide is verified and reviewed. Your safety is our top priority. | Value prop description |
| `value_2_title` | Local Expertise | Value prop heading |
| `value_2_desc` | Our guides are locals who know the terrain, culture, and hidden gems. | Value prop description |
| `value_3_title` | Community Driven | Value prop heading |
| `value_3_desc` | We empower local communities by connecting them with travellers. | Value prop description |
| `value_4_title` | Responsible Tourism | Value prop heading |
| `value_4_desc` | We promote eco-friendly and sustainable travel practices. | Value prop description |
| `card_1_title` | The Vision | Card heading |
| `card_1_desc` | Created by travellers, for travellers. | Card description |
| `card_2_title` | Our Mission | Card heading |
| `card_2_desc` | To make every Indian adventure safe, memorable, and authentic. | Card description |
| `card_3_title` | Our Promise | Card heading |
| `card_3_desc` | Transparent pricing, verified guides, genuine reviews, and responsive support. | Card description |

---

## Destinations (slug: `destinations`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_label` | Explore India with Local Experts | Hero label |
| `hero_title` | Where Will Your \<br /\>\<span\>Journey\</span\> Begin? | HTML heading |
| `hero_description` | Discover 7 incredible Indian states through the eyes of verified local guides. | Hero paragraph |
| `ai_badge` | AI-Powered Planning | Badge text |
| `ai_title` | Not Sure Where to Go? | AI section heading |
| `ai_description` | Describe your ideal vacation and our AI Travel Planner will suggest... | AI section description |
| `states_label` | Destinations | Section label |
| `states_title` | Explore by State | Section heading |
| `filter_title` | Find Your Perfect Trip | Filter heading |
| `filter_subtitle` | Filter by your preferences and travel style | Filter subtitle |
| `experience_label` | Choose Your Style | Section label |
| `experience_title` | What Kind of Experience? | Section heading |
| `experience_subtitle` | Whether you seek adventure, culture, or relaxation... | Section subtitle |
| `seasonal_label` | Perfect for {currentSeason} | Dynamic season label |
| `seasonal_title` | Where to Go This Season | Section heading |
| `trending_label` | Hot Right Now | Section label |
| `trending_title` | Trending Experiences | Section heading |
| `loved_label` | Customer Favorites | Section label |
| `loved_title` | Most Loved Experiences | Section heading |
| `guides_label` | Expert Local Guides | Section label |
| `guides_title` | Meet Your Future Guide | Section heading |
| `guides_subtitle` | Our top-rated guides across all destinations. | Section subtitle |

---

## Explore (slug: `explore`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_badge` | Explore India | Badge text |
| `hero_title` | Every State. Every Story.\<br /\>\<span\>Your Next Adventure.\</span\> | HTML heading |
| `hero_description` | From the snow-capped Himalayas to the sun-kissed coasts of Kerala... | Hero paragraph |
| `featured_label` | Top Destinations | Section label |
| `featured_title` | Start Your Journey | Section heading |
| `featured_subtitle` | Our most popular states with verified local guides. | Section subtitle |
| `all_states_title` | All States & Territories | Section heading |
| `all_states_subtitle` | Explore every corner of India. | Section subtitle |
| `cta_title` | Can't Decide Where to Go? | CTA heading |
| `cta_description` | Use our AI travel assistant to find the perfect destination. | CTA description |

---

## Experiences (slug: `experiences`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_title` | Find Your Perfect\<br /\>\<span\>Travel Experience\</span\> | HTML heading |
| `hero_description` | From city tours with local experts to mountain adventures... | Hero paragraph |
| `categories_label` | Choose Your Style | Section label |
| `categories_title` | Browse by Experience Type | Section heading |
| `trending_title` | Trending Now | Section heading |
| `trending_subtitle` | Popular experiences this season | Section subtitle |
| `upcoming_title` | Upcoming Departures | Section heading |
| `upcoming_subtitle` | Book a seat on these scheduled trips | Section subtitle |
| `loved_title` | Most Loved Experiences | Section heading |
| `loved_subtitle` | Highest rated by travelers | Section subtitle |
| `destinations_label` | Where to Go | Section label |
| `destinations_title` | Popular Destinations | Section heading |
| `ai_title` | Not Sure What to Choose? | AI section heading |
| `ai_description` | Tell us about your ideal trip and let our AI find the perfect experiences. | AI section description |
| `guides_label` | Expert Guides | Section label |
| `guides_title` | Travel with the Best | Section heading |
| `guides_subtitle` | Verified local experts who know every hidden gem | Section subtitle |
| `cta_title` | Ready to Start Your Journey? | CTA heading |
| `cta_description` | Join thousands of travelers who found their perfect experience. | CTA description |

---

## Guides (slug: `guides`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_label` | Verified Experts | Hero label |
| `hero_title` | All \<em\>Guides\</em\> | HTML heading with italic |
| `hero_description` | Browse our network of verified local experts. | Hero paragraph |
| `cta_label` | Join Our Network | CTA label |
| `cta_title` | Are You a Local Guide? | CTA heading |
| `cta_description` | Join India's premier guide booking platform. | CTA description |

---

## Contact (slug: `contact`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_label` | Reach Out | Hero label |
| `hero_title` | Contact \<em\>Us\</em\> | HTML heading |
| `hero_description` | Have questions? We'd love to hear from you. | Hero paragraph |
| `contact_heading` | Get In Touch | Section heading |
| `office_address` | Dehradun, Uttarakhand\<br /\>India - 248001 | HTML with line break |
| `email_addresses` | hello@booktheguide.com\<br /\>support@booktheguide.com | HTML with line break |
| `phone_numbers` | +91 98765 43210\<br /\>Mon - Sat, 9 AM - 7 PM IST | HTML with line break |
| `response_time` | We typically respond within 24 hours | Plain text |
| `faq_heading` | Frequently Asked Questions | Section heading |

---

## Group Trips (slug: `group-trips`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_badge` | Group Trips | Badge text |
| `hero_title` | Travel Together. \<span\>Save More.\</span\> | HTML heading |
| `hero_description` | Join fixed-departure group trips with verified local guides. | Hero paragraph |
| `upcoming_title` | Upcoming Departures | Section heading |
| `upcoming_subtitle` | Seats filling fast — book your spot now. | Section subtitle |
| `by_state_title` | Group Trips by State | Section heading |
| `all_title` | All Group Trips | Section heading |
| `how_title` | How Group Trips Work | Section heading |
| `cta_title` | Ready to Join a Group Trip? | CTA heading |
| `cta_description` | Find the perfect group adventure and book your seat today. | CTA description |

---

## Trending (slug: `trending`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_label` | What's Hot | Hero label |
| `hero_title` | Trending \<em\>Packages\</em\> | HTML heading |
| `hero_description` | Handpicked adventures that travellers love. | Hero paragraph |

---

## Upcoming Trips (slug: `upcoming-trips`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_label` | Fixed Departures | Hero label |
| `hero_title` | Upcoming \<em\>Trips\</em\> | HTML heading |
| `hero_description` | Join upcoming fixed departures with other travellers. | Hero paragraph |

---

## Blog (slug: `blog`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_badge` | Blog | Badge text |
| `hero_title` | Stories, Guides &amp; \<span\>Travel Tips\</span\> | HTML heading |
| `hero_description` | Itineraries, packing lists, best-time-to-visit guides, and insider stories. | Hero paragraph |
| `browse_state_title` | Browse by State | Section heading |
| `articles_title` | Latest Articles | Section heading |
| `articles_subtitle` | Fresh from our guides and travel writers. | Section subtitle |
| `cta_title` | Are You a Guide? Share Your Stories. | CTA heading |
| `cta_description` | Join Book The Guide and publish travel articles and itineraries. | CTA description |

---

## Pages Without Content Blocks

- **Terms** (slug: `terms`) — Static legal content, uses SEO content block only
- **Privacy** (slug: `privacy`) — Static legal content, uses SEO content block only
- **Corporate Trip** (slug: `corporate-trip`) — Client component, not yet converted

---

## Dynamic Template Pages

These are template pages that generate pages for every state/category combination. Content blocks are stored in WordPress Custom Post Types (CPTs), not regular Pages.

### State Hub Template (CPT: `btg_state_hub`, route: `/explore/[state]`)

WordPress slug format: state slug (e.g., `delhi`, `rajasthan`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `discover_title` | Discover {State} with Local Experts | Section heading (HTML) |
| `discover_description` | {state.description} | State overview |
| `experiences_label` | Explore by Category | Section label |
| `experiences_title` | Experience {State} | Section heading (HTML) |
| `experiences_subtitle` | Choose how you want to explore | Subtitle |
| `destinations_label` | Popular Destinations | Section label |
| `destinations_title` | Explore {State} Destinations | Section heading (HTML) |
| `destinations_subtitle` | Top places to visit in {State} | Subtitle |
| `popular_label` | Top Rated | Section label |
| `popular_title` | Popular in {State} | Section heading (HTML) |
| `popular_subtitle` | Highest rated experiences | Subtitle |
| `guides_label` | Local Experts | Section label |
| `guides_title` | Guides in {State} | Section heading (HTML) |
| `guides_subtitle` | Meet verified local guides | Subtitle |
| `blog_label` | Travel Stories | Section label |
| `blog_title` | {State} Blog | Section heading (HTML) |
| `blog_subtitle` | Tips and guides for {State} | Subtitle |
| `social_title` | Share Your {State} Story | Section heading (HTML) |
| `social_subtitle` | Tag #booktheguide{state} | Subtitle |
| `all_states_label` | Explore India | Section label |
| `all_states_title` | All States | Section heading (HTML) |
| `all_states_subtitle` | Discover guides across India | Subtitle |
| `cta_label` | Planning a Trip? | Section label |
| `cta_title` | Ready to Explore {State}? | Section heading (HTML) |
| `cta_description` | Connect with a verified guide... | CTA description |
| `faq_label` | Got Questions? | FAQ section label |
| `faq_title` | Frequently Asked Questions | FAQ heading (HTML) |
| `faq_subtitle` | Everything you need to know | FAQ subtitle |

### Category Landing Template (CPT: `btg_category_landing`, route: `/experiences/[category]`)

WordPress slug format: category URL slug (e.g., `tourist-guides`, `adventure-guides`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `browse_label` | Browse by Type | Quick filters label |
| `main_title` | Best {Category} in India | Section heading (HTML) |
| `main_description` | {category description} | Long description |
| `stat1_label` | Verified Guides | Stats card label |
| `stat2_label` | Experiences | Stats card label |
| `stat3_label` | States Covered | Stats card label |
| `stat4_label` | Avg Rating | Stats card label |
| `stat4_value` | 4.8★ | Stats card value |
| `bystate_label` | By State | Section label |
| `bystate_title` | Find {Category} to Explore Indian States | Section heading (HTML) |
| `bystate_subtitle` | Pick a state to see all ... packages | Subtitle |
| `all_label` | All {Category} | Section label |
| `all_title` | All {Category} | Section heading (HTML) |
| `all_subtitle` | {count} experiences across India | Subtitle |
| `recommended_label` | Hand-picked for You | Section label |
| `recommended_title` | Recommended {Category} | Section heading (HTML) |
| `recommended_subtitle` | Top-rated, highly reviewed experiences | Subtitle |
| `other_label` | Explore More | Section label |
| `other_title` | Other Experiences | Section heading (HTML) |
| `blog_label` | Travel Stories | Section label |
| `blog_title` | {Category} Blog | Section heading (HTML) |
| `blog_subtitle` | Tips, itineraries, and guides | Subtitle |
| `faq_label` | Got Questions? | FAQ section label |
| `faq_title` | Frequently Asked Questions | FAQ heading (HTML) |
| `cta_label` | Can't find what you're looking for? | CTA label |
| `cta_title` | Want a tailor-made experience? | CTA heading (HTML) |
| `cta_description` | Tell us your dream ... itinerary | CTA description |

### State × Category Template (CPT: `btg_state_category`, route: `/explore/[state]/[category]`)

WordPress slug format: `{state}-{category}` (e.g., `rajasthan-adventure-guides`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_badge` | {State} · {Category} | Hero badge text |
| `hero_title` | {Category} in {State} | Hero heading |
| `hero_description` | {description} — curated from best local guides | Hero subtitle |
| `filter_dest_label` | Filter by City / Destination | Filter section label |
| `filter_activity_label` | Activity Type | Filter section label |
| `guides_title` | Guides for {Category} in {State} | Guides section heading |
| `guides_subtitle` | Verified guides specialising in ... | Guides subtitle |
| `other_title` | Other Experiences in {State} | Cross-link heading |
| `cta_title` | Book Your {Category} Experience | CTA heading |
| `cta_description` | Connect with verified local guides... | CTA description |
| `faq_title` | FAQ — {Category} in {State} | FAQ heading |

### Group Trips by State (CPT: `btg_state_category`, route: `/group-trips/[state]`)

WordPress slug format: `{state}-group-trips` (e.g., `himachal-pradesh-group-trips`)

| Key | Default Value | Notes |
|-----|--------------|-------|
| `hero_badge` | Group Trips | Hero badge text |
| `hero_title` | Group Trips in {State} | Hero heading |
| `hero_description` | Fixed departure group travel experiences... | Hero subtitle |
| `departures_title` | Upcoming Departures | Departures section heading |
| `related_title` | More in {State} | Related links heading |
| `cta_title` | Can't Find Your Dates? | CTA heading |
| `cta_description` | Request a personal booking... | CTA description |

---

## Summary

- **Total pages with content blocks**: 11 (landing pages)
- **Total dynamic templates with content blocks**: 4 (state hub, category landing, state×category, group trips by state)
- **Total unique content block keys**: ~150+
- **Image keys**: 1 (`hero_image` on homepage) + image repeaters on all CPTs
- **Special repeaters**: Reviews (homepage), Gallery Images (homepage)
- **All pages also support**: FAQs, Internal Links, SEO Content Block, Yoast SEO metadata
- **All CPTs also support**: Content Blocks, Content Images, FAQs, Internal Links, SEO Content Block
