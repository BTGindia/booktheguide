// ─────────────────────────────────────────────────────────────
//  WPGraphQL Queries for Book The Guide
// ─────────────────────────────────────────────────────────────
//
//  All queries assume these WP plugins are installed:
//    - WPGraphQL
//    - WPGraphQL for ACF (or WPGraphQL for Custom Fields)
//    - WPGraphQL Yoast SEO (or WPGraphQL for RankMath SEO)
//
//  Custom Post Types registered in WordPress:
//    - stateHub       → /explore/{state}
//    - categoryLanding → /experiences/{category}
//    - stateCategory  → /explore/{state}/{category}
//    - post (native)  → /blog/{slug}
//    - page (native)  → /about, /terms, /privacy, /contact
//
// ─────────────────────────────────────────────────────────────

/* ── Shared Fragments ── */

export const SEO_FRAGMENT = `
  fragment SeoFields on PostTypeSEO {
    title
    metaDesc
    canonical
    opengraphTitle
    opengraphDescription
    opengraphImage {
      sourceUrl
      altText
    }
    opengraphUrl
    opengraphType
    twitterTitle
    twitterDescription
    twitterImage {
      sourceUrl
    }
    metaRobotsNoindex
    metaRobotsNofollow
    focuskw
    schema {
      raw
    }
    breadcrumbs {
      text
      url
    }
  }
`;

export const FEATURED_IMAGE_FRAGMENT = `
  fragment FeaturedImageFields on NodeWithFeaturedImageToMediaItemConnectionEdge {
    node {
      sourceUrl
      altText
      mediaDetails {
        width
        height
      }
    }
  }
`;

export const AUTHOR_FRAGMENT = `
  fragment AuthorFields on NodeWithAuthorToUserConnectionEdge {
    node {
      name
      slug
      avatar {
        url
      }
      description
    }
  }
`;

export const FAQ_FRAGMENT = `
  fragment FaqFields on AcfFaqItem {
    question
    answer
  }
`;

/* ── Blog / Posts Queries ── */

export const GET_ALL_POSTS = `
  ${SEO_FRAGMENT}
  ${FEATURED_IMAGE_FRAGMENT}
  ${AUTHOR_FRAGMENT}
  query GetAllPosts($first: Int = 12, $after: String, $categorySlug: String) {
    posts(
      first: $first
      after: $after
      where: { 
        status: PUBLISH
        categoryName: $categorySlug
        orderby: { field: DATE, order: DESC }
      }
    ) {
      nodes {
        id
        databaseId
        title
        slug
        date
        modified
        excerpt
        featuredImage {
          ...FeaturedImageFields
        }
        author {
          ...AuthorFields
        }
        categories {
          nodes {
            id
            name
            slug
          }
        }
        tags {
          nodes {
            id
            name
            slug
          }
        }
        seo {
          ...SeoFields
        }
        blogFields {
          readTime
          destination
          state
          relatedGuideSlug
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_POST_BY_SLUG = `
  ${SEO_FRAGMENT}
  ${FEATURED_IMAGE_FRAGMENT}
  ${AUTHOR_FRAGMENT}
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      date
      modified
      excerpt
      content
      featuredImage {
        ...FeaturedImageFields
      }
      author {
        ...AuthorFields
      }
      categories {
        nodes {
          id
          name
          slug
        }
      }
      tags {
        nodes {
          id
          name
          slug
        }
      }
      seo {
        ...SeoFields
      }
      blogFields {
        readTime
        destination
        state
        relatedGuideSlug
        heroImage {
          sourceUrl
          altText
        }
        faqItems {
          question
          answer
        }
      }
    }
  }
`;

export const GET_POSTS_BY_STATE = `
  ${SEO_FRAGMENT}
  ${FEATURED_IMAGE_FRAGMENT}
  ${AUTHOR_FRAGMENT}
  query GetPostsByState($stateSlug: String!, $first: Int = 12) {
    posts(
      first: $first
      where: {
        status: PUBLISH
        metaQuery: {
          metaArray: [
            { key: "state", value: $stateSlug, compare: EQUAL_TO }
          ]
        }
        orderby: { field: DATE, order: DESC }
      }
    ) {
      nodes {
        id
        databaseId
        title
        slug
        date
        modified
        excerpt
        featuredImage {
          ...FeaturedImageFields
        }
        author {
          ...AuthorFields
        }
        categories {
          nodes { id name slug }
        }
        tags {
          nodes { id name slug }
        }
        seo {
          ...SeoFields
        }
        blogFields {
          readTime
          destination
          state
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_ALL_POST_SLUGS = `
  query GetAllPostSlugs($first: Int = 500) {
    posts(first: $first, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
      }
    }
  }
`;

/* ── Page Queries (About, Terms, Privacy, Contact) ── */

export const GET_PAGE_BY_SLUG = `
  ${SEO_FRAGMENT}
  ${FEATURED_IMAGE_FRAGMENT}
  query GetPageBySlug($slug: ID!) {
    page(id: $slug, idType: URI) {
      id
      databaseId
      title
      slug
      content
      date
      modified
      featuredImage {
        ...FeaturedImageFields
      }
      seo {
        ...SeoFields
      }
      pageFields {
        sections {
          heading
          body
          image {
            sourceUrl
            altText
          }
        }
        faqItems {
          question
          answer
        }
        seoContentBlock
        internalLinks {
          label
          url
          description
        }
        contentBlocks {
          blockKey
          blockValue
        }
        contentImages {
          imageKey
          image {
            sourceUrl
            altText
          }
        }
        reviews {
          name
          location
          rating
          text
          trip
          avatar {
            sourceUrl
            altText
          }
        }
        galleryImages {
          sourceUrl
          altText
        }
      }
    }
  }
`;

/* ── State Hub Custom Post Type ── */

export const GET_STATE_HUB = `
  ${SEO_FRAGMENT}
  ${FEATURED_IMAGE_FRAGMENT}
  query GetStateHub($slug: ID!) {
    stateHub(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      content
      date
      modified
      featuredImage {
        ...FeaturedImageFields
      }
      seo {
        ...SeoFields
      }
      stateHubFields {
        stateSlug
        tagline
        heroDescription
        heroImage {
          sourceUrl
          altText
        }
        bestTimeToVisit
        highlights
        overviewContent
        whyBookGuide
        travelTips
        faqItems {
          question
          answer
        }
        relatedStates
        internalLinks {
          label
          url
          description
        }
        contentBlocks {
          blockKey
          blockValue
        }
        contentImages {
          imageKey
          image {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

export const GET_ALL_STATE_HUBS = `
  query GetAllStateHubs {
    stateHubs(first: 50, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
        stateHubFields {
          stateSlug
        }
      }
    }
  }
`;

/* ── Category Landing Custom Post Type ── */

export const GET_CATEGORY_LANDING = `
  ${SEO_FRAGMENT}
  ${FEATURED_IMAGE_FRAGMENT}
  query GetCategoryLanding($slug: ID!) {
    categoryLanding(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      content
      date
      modified
      featuredImage {
        ...FeaturedImageFields
      }
      seo {
        ...SeoFields
      }
      categoryLandingFields {
        categorySlug
        tagline
        heroDescription
        heroImage {
          sourceUrl
          altText
        }
        whyThisExperience
        whatToExpect
        faqItems {
          question
          answer
        }
        seoContentBlock
        internalLinks {
          label
          url
          description
        }
        contentBlocks {
          blockKey
          blockValue
        }
        contentImages {
          imageKey
          image {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

export const GET_ALL_CATEGORY_LANDINGS = `
  query GetAllCategoryLandings {
    categoryLandings(first: 20, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
        categoryLandingFields {
          categorySlug
        }
      }
    }
  }
`;

/* ── State × Category Combo Custom Post Type ── */

export const GET_STATE_CATEGORY = `
  ${SEO_FRAGMENT}
  ${FEATURED_IMAGE_FRAGMENT}
  query GetStateCategory($slug: ID!) {
    stateCategory(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      content
      date
      modified
      featuredImage {
        ...FeaturedImageFields
      }
      seo {
        ...SeoFields
      }
      stateCategoryFields {
        stateSlug
        categorySlug
        tagline
        heroDescription
        heroImage {
          sourceUrl
          altText
        }
        overview
        faqItems {
          question
          answer
        }
        seoContentBlock
        internalLinks {
          label
          url
          description
        }
        contentBlocks {
          blockKey
          blockValue
        }
        contentImages {
          imageKey
          image {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

export const GET_ALL_STATE_CATEGORIES = `
  query GetAllStateCategories {
    stateCategories(first: 200, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
        stateCategoryFields {
          stateSlug
          categorySlug
        }
      }
    }
  }
`;

/* ── Global SEO / Site Settings ── */

export const GET_GLOBAL_SEO = `
  query GetGlobalSeo {
    seo {
      schema {
        siteName
        siteUrl
        companyName
        companyLogo {
          sourceUrl
          altText
        }
      }
      social {
        facebook { url }
        twitter { username }
        instagram { url }
        youTube { url }
      }
    }
  }
`;

/* ── Menus (for WP-managed navigation if needed) ── */

export const GET_MENU = `
  query GetMenu($slug: ID!) {
    menu(id: $slug, idType: SLUG) {
      menuItems {
        nodes {
          id
          label
          url
          parentId
          childItems {
            nodes {
              id
              label
              url
            }
          }
        }
      }
    }
  }
`;

/* ── Sitemap Helpers ── */

export const GET_ALL_CONTENT_FOR_SITEMAP = `
  query GetAllContentForSitemap {
    posts(first: 500, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
        seo { canonical }
      }
    }
    pages(first: 50, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
        seo { canonical }
      }
    }
    stateHubs(first: 50, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
        seo { canonical }
      }
    }
    categoryLandings(first: 20, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
        seo { canonical }
      }
    }
    stateCategories(first: 200, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
        seo { canonical }
      }
    }
    btgTrips(first: 500, where: { status: PUBLISH }) {
      nodes {
        slug
        modified
        seo { canonical }
      }
    }
  }
`;

/* ── Trip Queries ── */

export const GET_TRIP_BY_SLUG = `
  ${SEO_FRAGMENT}
  ${FEATURED_IMAGE_FRAGMENT}
  query GetTripBySlug($slug: ID!) {
    btgTrip(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      content
      date
      modified
      featuredImage { ...FeaturedImageFields }
      seo { ...SeoFields }
      tripFields {
        tripSlug
        seoTitle
        seoDescription
        heroDescription
        heroImage { sourceUrl altText }
        overview
        faqItems { question answer }
        seoContentBlock
        internalLinks { label url description }
        contentBlocks { blockKey blockValue }
        contentImages { imageKey image { sourceUrl altText } }
      }
    }
  }
`;

export const GET_ALL_TRIPS = `
  query GetAllTrips {
    btgTrips(first: 500, where: { status: PUBLISH }) {
      nodes {
        slug
        tripFields { tripSlug }
      }
    }
  }
`;

/* ── Page Config Queries ── */

export const GET_PAGE_CONFIG = `
  query GetPageConfig($slug: ID!) {
    pageConfig(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      pageConfigFields {
        pageSlug
        sectionOrder { sectionKey visible sortBy limit }
        featuredIds { section itemId position }
        displaySettings { settingKey settingValue }
      }
    }
  }
`;

export const GET_ALL_PAGE_CONFIGS = `
  query GetAllPageConfigs {
    pageConfigs(first: 100, where: { status: PUBLISH }) {
      nodes {
        slug
        pageConfigFields {
          pageSlug
          sectionOrder { sectionKey visible sortBy limit }
          featuredIds { section itemId position }
          displaySettings { settingKey settingValue }
        }
      }
    }
  }
`;
