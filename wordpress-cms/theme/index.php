<?php
/**
 * Headless theme — no frontend rendering.
 * All content is served via WPGraphQL to the Next.js frontend.
 *
 * For logged-in admins viewing post previews (e.g. "View Post" button in wp-admin),
 * render a simple admin-only preview page instead of redirecting.
 *
 * For all public/anonymous requests, redirect to the correct Next.js page.
 */

// ── If this is an admin preview / logged-in request, show a WP admin preview ──
if (is_user_logged_in() && (current_user_can('edit_posts') || current_user_can('edit_pages'))) {
    // Show a simple preview page inside WordPress for admins
    get_header();
    ?>
    <div style="font-family:sans-serif;max-width:900px;margin:40px auto;padding:20px;background:#fff;border:1px solid #ddd;border-radius:8px;">
        <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
            <div style="background:#0073aa;color:#fff;padding:10px 20px;border-radius:4px;margin-bottom:20px;">
                <strong>WordPress Admin Preview</strong>
                &nbsp;|&nbsp; Post type: <code style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:3px;"><?php echo get_post_type(); ?></code>
                &nbsp;|&nbsp; Slug: <code style="background:rgba(255,255,255,0.2);padding:2px 6px;border-radius:3px;"><?php echo get_post_field('post_name'); ?></code>
                &nbsp;&nbsp;
                <?php
                // Link to the actual Next.js live page
                $live_url = btg_get_nextjs_url_by_slug(get_post_type(), get_post_field('post_name'), get_the_ID());
                if ($live_url) {
                    echo '<a href="' . esc_url($live_url) . '" target="_blank" style="color:#fff;text-decoration:underline;">View live on booktheguide.com ↗</a>';
                }
                ?>
            </div>
            <h1><?php the_title(); ?></h1>
            <div style="color:#666;margin-bottom:20px;">
                <strong>Status:</strong> <?php echo get_post_status(); ?> &nbsp;|&nbsp;
                <strong>Modified:</strong> <?php echo get_the_modified_date(); ?>
            </div>
            <?php
            // Show ACF/custom fields
            $meta = get_post_meta(get_the_ID());
            if ($meta) {
                echo '<h3>SEO / Custom Fields</h3><table style="border-collapse:collapse;width:100%">';
                foreach ($meta as $key => $values) {
                    if (strpos($key, '_') === 0) continue; // skip internal WP meta
                    echo '<tr><td style="padding:6px 10px;border:1px solid #eee;width:200px;background:#f9f9f9;font-weight:600">' . esc_html($key) . '</td>';
                    echo '<td style="padding:6px 10px;border:1px solid #eee">' . esc_html(implode(', ', $values)) . '</td></tr>';
                }
                echo '</table>';
            }
            ?>
            <hr style="margin:30px 0;">
            <h3>Post Content</h3>
            <div style="background:#f9f9f9;padding:15px;border-radius:4px;"><?php the_content(); ?></div>
        <?php endwhile; else : ?>
            <p>No post found.</p>
        <?php endif; ?>
    </div>
    <?php
    get_footer();
    return;
}

// ── Public / anonymous request: redirect to correct Next.js page ──

$next = 'https://www.booktheguide.com';

if (is_singular()) {
    $post      = get_queried_object();
    $post_type = $post->post_type ?? '';
    $slug      = $post->post_name ?? '';
    $id        = $post->ID ?? 0;

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
            $state    = get_post_meta($id, 'state_slug', true);
            $category = get_post_meta($id, 'category_slug', true);
            $next = $state && $category
                ? "https://www.booktheguide.com/explore/{$state}/{$category}"
                : "https://www.booktheguide.com/explore/{$slug}";
            break;
        case 'post':
            $next = "https://www.booktheguide.com/blog/{$slug}";
            break;
        case 'page':
            $next = $slug === 'home' || $slug === 'front-page'
                ? 'https://www.booktheguide.com'
                : "https://www.booktheguide.com/{$slug}";
            break;
    }
}

wp_redirect($next, 301);
exit;

/**
 * Helper: build Next.js URL from post type + slug (used in preview banner above)
 */
function btg_get_nextjs_url_by_slug(string $type, string $slug, int $id): string {
    $base = 'https://www.booktheguide.com';
    switch ($type) {
        case 'state_hub':        return "{$base}/destinations/{$slug}";
        case 'category_landing': return "{$base}/experiences/{$slug}";
        case 'btg_trip':         return "{$base}/trips/{$slug}";
        case 'state_category':
            $state = get_post_meta($id, 'state_slug', true);
            $cat   = get_post_meta($id, 'category_slug', true);
            return $state && $cat ? "{$base}/explore/{$state}/{$cat}" : "{$base}/explore/{$slug}";
        case 'post':  return "{$base}/blog/{$slug}";
        case 'page':  return $slug === 'home' ? $base : "{$base}/{$slug}";
        default:      return $base;
    }
}
