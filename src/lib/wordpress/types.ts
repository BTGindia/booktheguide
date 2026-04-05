// ─────────────────────────────────────────────────────────────
//  WordPress / WPGraphQL TypeScript types for Book The Guide
// ─────────────────────────────────────────────────────────────

/* ── SEO (Yoast / RankMath via WPGraphQL SEO plugin) ── */

export interface WPSeo {
  title: string;
  metaDesc: string;
  canonical: string;
  opengraphTitle: string;
  opengraphDescription: string;
  opengraphImage: { sourceUrl: string; altText: string } | null;
  opengraphUrl: string;
  opengraphType: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: { sourceUrl: string } | null;
  metaRobotsNoindex: string;
  metaRobotsNofollow: string;
  focuskw: string;
  schema: { raw: string } | null;
  breadcrumbs: { text: string; url: string }[];
}

/* ── Media ── */

export interface WPMediaItem {
  sourceUrl: string;
  altText: string;
  mediaDetails: {
    width: number;
    height: number;
  } | null;
}

/* ── Author ── */

export interface WPAuthor {
  name: string;
  slug: string;
  avatar: { url: string } | null;
  description: string;
}

/* ── Featured Image ── */

export interface WPFeaturedImage {
  node: WPMediaItem;
}

/* ── Categories / Tags / Taxonomies ── */

export interface WPTerm {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number | null;
}

export interface WPTermConnection {
  nodes: WPTerm[];
}

/* ── Core Post (Blog) ── */

export interface WPPost {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  date: string;
  modified: string;
  excerpt: string;
  content: string;
  featuredImage: WPFeaturedImage | null;
  author: { node: WPAuthor };
  categories: WPTermConnection;
  tags: WPTermConnection;
  seo: WPSeo;
  /** ACF fields for blog-specific structured data */
  blogFields: WPBlogFields | null;
}

export interface WPBlogFields {
  readTime: string | null;
  destination: string | null;
  state: string | null;
  relatedGuideSlug: string | null;
  heroImage: WPMediaItem | null;
  faqItems: WPFaqItem[] | null;
}

export interface WPFaqItem {
  question: string;
  answer: string;
}

/* ── Page (Utility pages: About, Terms, Privacy, Contact) ── */

export interface WPPage {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  date: string;
  modified: string;
  featuredImage: WPFeaturedImage | null;
  seo: WPSeo;
  /** ACF fields for structured utility page content */
  pageFields: WPPageFields | null;
}

export interface WPPageFields {
  sections: WPPageSection[] | null;
  faqItems: WPFaqItem[] | null;
  seoContentBlock: string | null;
  internalLinks: WPInternalLink[] | null;
  contentBlocks: WPContentBlock[] | null;
  contentImages: WPContentImage[] | null;
  reviews: WPReview[] | null;
  galleryImages: WPMediaItem[] | null;
}

export interface WPContentBlock {
  blockKey: string;
  blockValue: string;
}

export interface WPContentImage {
  imageKey: string;
  image: WPMediaItem | null;
}

export interface WPReview {
  name: string;
  location: string;
  rating: number;
  text: string;
  trip: string;
  avatar: WPMediaItem | null;
}

export interface WPPageSection {
  heading: string;
  body: string;
  image: WPMediaItem | null;
}

/* ── Custom Post Type: State Hub ── */

export interface WPStateHub {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  date: string;
  modified: string;
  featuredImage: WPFeaturedImage | null;
  seo: WPSeo;
  stateHubFields: WPStateHubFields;
}

export interface WPStateHubFields {
  stateSlug: string;
  tagline: string;
  heroDescription: string;
  heroImage: WPMediaItem | null;
  bestTimeToVisit: string | null;
  highlights: string[] | null;
  overviewContent: string | null;
  whyBookGuide: string | null;
  travelTips: string | null;
  faqItems: WPFaqItem[] | null;
  relatedStates: string[] | null;
  /** Internal linking sections for SEO */
  internalLinks: WPInternalLink[] | null;
  /** Key-value content blocks for editable text/HTML */
  contentBlocks: WPContentBlock[] | null;
  /** Key-value image blocks */
  contentImages: WPContentImage[] | null;
}

export interface WPInternalLink {
  label: string;
  url: string;
  description: string | null;
}

/* ── Custom Post Type: Category Landing ── */

export interface WPCategoryLanding {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  date: string;
  modified: string;
  featuredImage: WPFeaturedImage | null;
  seo: WPSeo;
  categoryLandingFields: WPCategoryLandingFields;
}

export interface WPCategoryLandingFields {
  categorySlug: string;
  tagline: string;
  heroDescription: string;
  heroImage: WPMediaItem | null;
  whyThisExperience: string | null;
  whatToExpect: string | null;
  faqItems: WPFaqItem[] | null;
  /** SEO content block for long-tail keywords */
  seoContentBlock: string | null;
  internalLinks: WPInternalLink[] | null;
  /** Key-value content blocks for editable text/HTML */
  contentBlocks: WPContentBlock[] | null;
  /** Key-value image blocks */
  contentImages: WPContentImage[] | null;
}

/* ── Custom Post Type: State × Category Combo ── */

export interface WPStateCategory {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  date: string;
  modified: string;
  featuredImage: WPFeaturedImage | null;
  seo: WPSeo;
  stateCategoryFields: WPStateCategoryFields;
}

export interface WPStateCategoryFields {
  stateSlug: string;
  categorySlug: string;
  tagline: string;
  heroDescription: string;
  heroImage: WPMediaItem | null;
  overview: string | null;
  faqItems: WPFaqItem[] | null;
  seoContentBlock: string | null;
  internalLinks: WPInternalLink[] | null;
  /** Key-value content blocks for editable text/HTML */
  contentBlocks: WPContentBlock[] | null;
  /** Key-value image blocks */
  contentImages: WPContentImage[] | null;
}

/* ── Custom Post Type: Trip (individual package pages for SEO) ── */

export interface WPTrip {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  date: string;
  modified: string;
  featuredImage: WPFeaturedImage | null;
  seo: WPSeo;
  tripFields: WPTripFields;
}

export interface WPTripFields {
  tripSlug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  heroDescription: string | null;
  heroImage: WPMediaItem | null;
  overview: string | null;
  faqItems: WPFaqItem[] | null;
  seoContentBlock: string | null;
  internalLinks: WPInternalLink[] | null;
  contentBlocks: WPContentBlock[] | null;
  contentImages: WPContentImage[] | null;
}

/* ── Custom Post Type: Page Config (UI Manager display settings) ── */

export interface WPPageConfig {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  pageConfigFields: WPPageConfigFields;
}

export interface WPPageConfigFields {
  pageSlug: string;
  sectionOrder: WPSectionOrder[] | null;
  featuredIds: WPFeaturedItem[] | null;
  displaySettings: WPDisplaySetting[] | null;
}

export interface WPSectionOrder {
  sectionKey: string;
  visible: boolean;
  sortBy: string;
  limit: number;
}

export interface WPFeaturedItem {
  section: string;
  itemId: string;
  position: number;
}

export interface WPDisplaySetting {
  settingKey: string;
  settingValue: string;
}

/* ── Global SEO Settings (from Yoast) ── */

export interface WPGlobalSeo {
  siteName: string;
  siteDescription: string;
  defaultImage: WPMediaItem | null;
  schema: {
    siteName: string;
    siteUrl: string;
    companyName: string;
    companyLogo: WPMediaItem | null;
  };
  social: {
    facebook: { url: string } | null;
    twitter: { username: string } | null;
    instagram: { url: string } | null;
    youtube: { url: string } | null;
  };
}

/* ── API Response Wrappers ── */

export interface WPPostsResponse {
  posts: {
    nodes: WPPost[];
    pageInfo: WPPageInfo;
  };
}

export interface WPPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface WPSitemapEntry {
  slug: string;
  modified: string;
  seo: { canonical: string };
}
