<?php
/**
 * Headless theme — no frontend rendering.
 * All content is served via WPGraphQL to the Next.js frontend.
 *
 * When WordPress tries to render a page (e.g. "View Post" in admin,
 * or Yoast preview), redirect to the matching Next.js page.
 */

$next = 'https://www.booktheguide.com';

// Map WordPress query vars / post types to Next.js URL paths
if (is_singular()) {
    $post      = get_queried_object();
    $post_type = $post->post_type ?? '';
    $slug      = $post->post_name ?? '';

    switch ($post_type) {
        case 'state_hub':
            $next = "https://www.booktheguide.com/destinations/{$slug}";
            break;
        case 'category_landing':
            $next = "https://www.booktheguide.com/experiences/{$slug}";
            break;
        case 'btg_trip':
            $next = "https://www.booktheguide.com/trips/{$slug}";
            break;
        case 'state_category':
            // slug format: {state}-{category}, e.g. "himachal-pradesh-trekking"
            // We store the actual state/category in post_meta; fall back to slug
            $state    = get_post_meta($post->ID, 'state_slug', true);
            $category = get_post_meta($post->ID, 'category_slug', true);
            if ($state && $category) {
                $next = "https://www.booktheguide.com/explore/{$state}/{$category}";
            } else {
                $next = "https://www.booktheguide.com/explore/{$slug}";
            }
            break;
        case 'post':
            $next = "https://www.booktheguide.com/blog/{$slug}";
            break;
        case 'page':
            $next = "https://www.booktheguide.com/{$slug}";
            break;
        default:
            $next = 'https://www.booktheguide.com';
    }
} elseif (is_home() || is_front_page()) {
    $next = 'https://www.booktheguide.com';
} elseif (is_archive()) {
    $next = 'https://www.booktheguide.com';
}

wp_redirect($next, 301);
exit;
