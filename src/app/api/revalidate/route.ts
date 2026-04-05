// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  WordPress Webhook â†’ Next.js On-Demand ISR Revalidation
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
//  When content is published/updated/deleted in WordPress,
//  a webhook hits this endpoint to purge the cached page.
//
//  WordPress setup:
//    Install "WP Webhooks" or use a simple snippet in functions.php:
//
//    add_action('save_post', function($post_id) {
//      $secret = 'YOUR_REVALIDATION_SECRET';
//      $url = 'https://www.booktheguide.com/api/revalidate';
//      wp_remote_post($url, [
//        'body' => json_encode([
//          'secret' => $secret,
//          'type'   => get_post_type($post_id),
//          'slug'   => get_post_field('post_name', $post_id),
//        ]),
//        'headers' => ['Content-Type' => 'application/json'],
//      ]);
//    });
//
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || '';

/** Map WordPress post type â†’ Next.js cache tags to purge + paths to revalidate. */
function getRevalidationTargets(
  postType: string,
  slug: string,
): { tags: string[]; paths: string[] } {
  switch (postType) {
    case 'post':
      return {
        tags: ['wp-posts', `wp-post-${slug}`],
        paths: ['/blog', `/blog/${slug}`],
      };
    case 'page': {
      // Map WordPress page slugs to the actual Next.js routes
      const pagePathMap: Record<string, string[]> = {
        home: ['/'],
        about: ['/about'],
        contact: ['/contact'],
        terms: ['/terms'],
        privacy: ['/privacy'],
        blog: ['/blog'],
        explore: ['/explore'],
        experiences: ['/experiences'],
        destinations: ['/destinations'],
        guides: ['/guides'],
        'group-trips': ['/group-trips'],
        trending: ['/trending'],
        'upcoming-trips': ['/upcoming-trips'],
        'corporate-trip': ['/corporate-trip'],
        search: ['/search'],
        inspiration: ['/inspiration'],
        wishlist: ['/wishlist'],
      };
      const paths = pagePathMap[slug] || [`/${slug}`];
      return {
        tags: ['wp-pages', `wp-page-${slug}`],
        paths,
      };
    }
    case 'state_hub':
      return {
        tags: ['wp-state-hubs', `wp-state-hub-${slug}`],
        paths: [`/explore/${slug}`],
      };
    case 'category_landing':
      return {
        tags: ['wp-category-landings', `wp-category-landing-${slug}`],
        paths: [`/experiences/${slug}`],
      };
    case 'state_category': {
      // slug format: "{state}-{category}" â€” revalidate the combo page
      const parts = slug.split('-');
      // Try to parse state and category from the slug
      const paths: string[] = [];
      if (parts.length >= 2) {
        // Reconstruct possible state/category paths
        for (let i = 1; i < parts.length; i++) {
          const stateSlug = parts.slice(0, i).join('-');
          const categorySlug = parts.slice(i).join('-');
          paths.push(`/explore/${stateSlug}/${categorySlug}`);
        }
      }
      return {
        tags: ['wp-state-categories', `wp-state-category-${slug}`],
        paths,
      };
    }
    default:
      return { tags: [], paths: [] };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, type, slug } = body;

    // Validate the secret
    if (!REVALIDATION_SECRET || secret !== REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    if (!type || !slug) {
      return NextResponse.json(
        { message: 'Missing required fields: type, slug' },
        { status: 400 },
      );
    }

    const { tags, paths } = getRevalidationTargets(type, slug);

    // Revalidate cache tags
    for (const tag of tags) {
      revalidateTag(tag);
    }

    // Revalidate specific paths
    for (const path of paths) {
      revalidatePath(path);
    }

    // Always revalidate the sitemap when any content changes
    revalidatePath('/sitemap.xml');

    return NextResponse.json({
      revalidated: true,
      tags,
      paths,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { message: 'Error revalidating', error: (err as Error).message },
      { status: 500 },
    );
  }
}
