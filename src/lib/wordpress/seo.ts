// ─────────────────────────────────────────────────────────────
//  SEO Metadata Mapping — WordPress → Next.js Metadata API
// ─────────────────────────────────────────────────────────────
//
//  Converts Yoast/RankMath SEO fields from WPGraphQL into
//  the Next.js `Metadata` object used by App Router.
//
// ─────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import type { WPSeo, WPFaqItem } from './types';

const SITE_URL = 'https://www.booktheguide.com';
const SITE_NAME = 'Book The Guide';

/**
 * Maps WordPress Yoast/RankMath SEO fields to Next.js Metadata.
 * Falls back to provided defaults when WP fields are empty.
 */
export function wpSeoToMetadata(
  seo: WPSeo | null | undefined,
  defaults: {
    title: string;
    description: string;
    url: string;
    image?: string;
  },
): Metadata {
  if (!seo) {
    return buildFallbackMetadata(defaults);
  }

  const title = seo.title || defaults.title;
  const description = seo.metaDesc || defaults.description;
  const canonical = seo.canonical || defaults.url;
  const ogImage = seo.opengraphImage?.sourceUrl || defaults.image;

  return {
    title,
    description,
    openGraph: {
      title: seo.opengraphTitle || title,
      description: seo.opengraphDescription || description,
      url: seo.opengraphUrl || canonical,
      siteName: SITE_NAME,
      type: (seo.opengraphType as any) || 'website',
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: seo.opengraphImage?.altText || title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.twitterTitle || title,
      description: seo.twitterDescription || description,
      ...(seo.twitterImage?.sourceUrl
        ? { images: [seo.twitterImage.sourceUrl] }
        : ogImage
        ? { images: [ogImage] }
        : {}),
    },
    robots: {
      index: seo.metaRobotsNoindex !== 'noindex',
      follow: seo.metaRobotsNofollow !== 'nofollow',
      googleBot: {
        index: seo.metaRobotsNoindex !== 'noindex',
        follow: seo.metaRobotsNofollow !== 'nofollow',
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical,
    },
  };
}

function buildFallbackMetadata(defaults: {
  title: string;
  description: string;
  url: string;
  image?: string;
}): Metadata {
  return {
    title: defaults.title,
    description: defaults.description,
    openGraph: {
      title: defaults.title,
      description: defaults.description,
      url: defaults.url,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: defaults.title,
      description: defaults.description,
    },
    alternates: {
      canonical: defaults.url,
    },
  };
}

/**
 * Generates JSON-LD FAQPage schema from WordPress FAQ fields.
 * Inject into page via <script type="application/ld+json">.
 */
export function buildFaqSchema(faqs: WPFaqItem[] | null | undefined): object | null {
  if (!faqs || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generates JSON-LD Article schema for blog posts.
 */
export function buildArticleSchema(post: {
  title: string;
  excerpt: string;
  date: string;
  modified: string;
  slug: string;
  authorName: string;
  image?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.modified,
    url: `${SITE_URL}/blog/${post.slug}`,
    author: {
      '@type': 'Person',
      name: post.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/btg-logo.png`,
      },
    },
    ...(post.image
      ? {
          image: {
            '@type': 'ImageObject',
            url: post.image,
          },
        }
      : {}),
  };
}

/**
 * Generates JSON-LD BreadcrumbList from WordPress SEO breadcrumbs.
 */
export function buildBreadcrumbSchema(
  breadcrumbs: { text: string; url: string }[] | null | undefined,
): object | null {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.text,
      item: crumb.url.startsWith('http') ? crumb.url : `${SITE_URL}${crumb.url}`,
    })),
  };
}

/**
 * Injects raw Yoast schema JSON into the page if available.
 * This is the full organization/website schema generated by Yoast.
 */
export function getYoastRawSchema(seo: WPSeo | null | undefined): string | null {
  if (!seo?.schema?.raw) return null;
  return seo.schema.raw;
}
