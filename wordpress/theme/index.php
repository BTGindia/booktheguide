<?php
/**
 * Headless theme.
 *
 * - Logged-in editors/admins: show WordPress-side preview page.
 * - Public visitors: redirect to the matching Next.js URL.
 */

if (is_user_logged_in() && current_user_can('edit_posts')) {
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
                $live_url = btg_get_nextjs_url_by_slug(get_post_type(), get_post_field('post_name'), get_the_ID());
                if ($live_url) {
                    echo '<a href="' . esc_url($live_url) . '" target="_blank" style="color:#fff;text-decoration:underline;">View live on booktheguide.com</a>';
                }
                ?>
            </div>
            <h1><?php the_title(); ?></h1>
            <div style="color:#666;margin-bottom:20px;">
                <strong>Status:</strong> <?php echo get_post_status(); ?> &nbsp;|&nbsp;
                <strong>Modified:</strong> <?php echo get_the_modified_date(); ?>
            </div>
            <?php the_content(); ?>
        <?php endwhile; else : ?>
            <p>No post found.</p>
        <?php endif; ?>
    </div>
    <?php
    get_footer();
    return;
}

$next = defined('BTG_NEXT_URL') ? rtrim(BTG_NEXT_URL, '/') : 'https://www.booktheguide.com';

if (is_singular()) {
    $post      = get_queried_object();
    $post_type = $post->post_type ?? '';
    $slug      = $post->post_name ?? '';
    $id        = $post->ID ?? 0;

    switch ($post_type) {
        case 'state_hub':
            $next = "{$next}/destinations/{$slug}";
            break;
        case 'category_landing':
            $next = "{$next}/experiences/{$slug}";
            break;
        case 'btg_trip':
            $next = "{$next}/trips/{$slug}";
            break;
        case 'state_category':
            $state = get_post_meta($id, 'state_slug', true);
            $cat   = get_post_meta($id, 'category_slug', true);
            $next  = $state && $cat ? "{$next}/explore/{$state}/{$cat}" : "{$next}/explore/{$slug}";
            break;
        case 'post':
            $next = "{$next}/blog/{$slug}";
            break;
        case 'page':
            $next = ($slug === 'home' || $slug === 'front-page') ? $next : "{$next}/{$slug}";
            break;
        default:
            $next = defined('BTG_NEXT_URL') ? rtrim(BTG_NEXT_URL, '/') : 'https://www.booktheguide.com';
    }
}

wp_redirect($next, 301);
exit;

function btg_get_nextjs_url_by_slug(string $type, string $slug, int $id): string {
    $base = defined('BTG_NEXT_URL') ? rtrim(BTG_NEXT_URL, '/') : 'https://www.booktheguide.com';
    switch ($type) {
        case 'state_hub':
            return "{$base}/destinations/{$slug}";
        case 'category_landing':
            return "{$base}/experiences/{$slug}";
        case 'btg_trip':
            return "{$base}/trips/{$slug}";
        case 'state_category':
            $state = get_post_meta($id, 'state_slug', true);
            $cat   = get_post_meta($id, 'category_slug', true);
            return $state && $cat ? "{$base}/explore/{$state}/{$cat}" : "{$base}/explore/{$slug}";
        case 'post':
            return "{$base}/blog/{$slug}";
        case 'page':
            return ($slug === 'home' || $slug === 'front-page') ? $base : "{$base}/{$slug}";
        default:
            return $base;
    }
}
