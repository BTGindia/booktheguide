<?php
/**
 * ─────────────────────────────────────────────────────────────
 *  Book The Guide — WordPress Theme Functions
 * ─────────────────────────────────────────────────────────────
 *
 *  This file registers Custom Post Types, ACF field groups,
 *  and webhook triggers for the Headless WordPress CMS.
 *
 *  Place this file in your WordPress theme's functions.php
 *  or in a custom plugin.
 *
 *  REQUIRED PLUGINS:
 *    - WPGraphQL
 *    - WPGraphQL for ACF
 *    - WPGraphQL Yoast SEO (or WPGraphQL for RankMath)
 *    - Advanced Custom Fields PRO
 *
 * ─────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════
//  0. ELEMENTOR + MEMORY CONFIGURATION
// ═══════════════════════════════════════════════════════════

// Increase memory limit so Elementor editor loads reliably
@ini_set('memory_limit', '512M');

// Register our custom post types with Elementor so the
// "Edit with Elementor" button appears and the editor loads.
// Runs in admin_init so it only updates the DB option when
// a value is actually missing (not on every request).
add_action('admin_init', function () {
    $elementor_cpt_support = get_option('elementor_cpt_support', ['page', 'post']);
    $btg_cpts = ['state_hub', 'category_landing', 'state_category', 'btg_trip', 'page_config'];
    $needs_update = false;
    foreach ($btg_cpts as $cpt) {
        if (!in_array($cpt, $elementor_cpt_support, true)) {
            $elementor_cpt_support[] = $cpt;
            $needs_update = true;
        }
    }
    if ($needs_update) {
        update_option('elementor_cpt_support', $elementor_cpt_support);
    }
});

// ═══════════════════════════════════════════════════════════
//  1. REGISTER CUSTOM POST TYPES
// ═══════════════════════════════════════════════════════════

add_action('init', function () {

    // ── State Hub Pages ──
    register_post_type('state_hub', [
        'labels' => [
            'name'          => 'State Hubs',
            'singular_name' => 'State Hub',
            'add_new_item'  => 'Add New State Hub',
            'edit_item'     => 'Edit State Hub',
        ],
        'public'              => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'stateHub',
        'graphql_plural_name' => 'stateHubs',
        'supports'            => ['title', 'editor', 'thumbnail', 'revisions', 'custom-fields'],
        'menu_icon'           => 'dashicons-location-alt',
        'has_archive'         => false,
        'rewrite'             => false,
    ]);

    // ── Category Landing Pages ──
    register_post_type('category_landing', [
        'labels' => [
            'name'          => 'Category Landings',
            'singular_name' => 'Category Landing',
            'add_new_item'  => 'Add New Category Landing',
            'edit_item'     => 'Edit Category Landing',
        ],
        'public'              => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'categoryLanding',
        'graphql_plural_name' => 'categoryLandings',
        'supports'            => ['title', 'editor', 'thumbnail', 'revisions', 'custom-fields'],
        'menu_icon'           => 'dashicons-category',
        'has_archive'         => false,
        'rewrite'             => false,
    ]);

    // ── Trip Pages (individual package/experience pages for SEO) ──
    register_post_type('btg_trip', [
        'labels' => [
            'name'          => 'Trips',
            'singular_name' => 'Trip',
            'add_new_item'  => 'Add New Trip',
            'edit_item'     => 'Edit Trip',
        ],
        'public'              => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'btgTrip',
        'graphql_plural_name' => 'btgTrips',
        'supports'            => ['title', 'editor', 'thumbnail', 'revisions', 'custom-fields'],
        'menu_icon'           => 'dashicons-airplane',
        'has_archive'         => false,
        'rewrite'             => false,
    ]);

    // ── Page Display Config (UI Manager settings per page) ──
    register_post_type('page_config', [
        'labels' => [
            'name'          => 'Page Configs',
            'singular_name' => 'Page Config',
            'add_new_item'  => 'Add Page Config',
            'edit_item'     => 'Edit Page Config',
        ],
        'public'              => false,
        'publicly_queryable'  => false,
        'show_ui'             => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'pageConfig',
        'graphql_plural_name' => 'pageConfigs',
        'supports'            => ['title', 'custom-fields'],
        'menu_icon'           => 'dashicons-layout',
        'has_archive'         => false,
        'rewrite'             => false,
        'capability_type'     => 'page',
    ]);

    // ── State × Category Combo Pages ──
    register_post_type('state_category', [
        'labels' => [
            'name'          => 'State × Category',
            'singular_name' => 'State Category',
            'add_new_item'  => 'Add New State Category',
            'edit_item'     => 'Edit State Category',
        ],
        'public'              => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_rest'        => true,
        'show_in_graphql'     => true,
        'graphql_single_name' => 'stateCategory',
        'graphql_plural_name' => 'stateCategories',
        'supports'            => ['title', 'editor', 'thumbnail', 'revisions', 'custom-fields'],
        'menu_icon'           => 'dashicons-grid-view',
        'has_archive'         => false,
        'rewrite'             => false,
    ]);
});


// ═══════════════════════════════════════════════════════════
//  2. REGISTER ACF FIELD GROUPS (Programmatic)
// ═══════════════════════════════════════════════════════════
//
//  These can also be created via ACF UI. This code serves as
//  a reference and ensures fields exist in version control.
//

add_action('acf/init', function () {
    if (!function_exists('acf_add_local_field_group')) return;

    // ── Blog Post Fields ──
    acf_add_local_field_group([
        'key'      => 'group_btg_blog',
        'title'    => 'Blog Post Fields',
        'fields'   => [
            ['key' => 'field_blog_read_time', 'label' => 'Read Time', 'name' => 'read_time', 'type' => 'text', 'instructions' => 'e.g. "7 min read"'],
            ['key' => 'field_blog_destination', 'label' => 'Destination', 'name' => 'destination', 'type' => 'text', 'instructions' => 'Primary destination (city/area name)'],
            ['key' => 'field_blog_state', 'label' => 'State Slug', 'name' => 'state', 'type' => 'text', 'instructions' => 'State slug for filtering (e.g. "uttarakhand")'],
            ['key' => 'field_blog_guide_slug', 'label' => 'Related Guide Slug', 'name' => 'related_guide_slug', 'type' => 'text', 'instructions' => 'Slug of the related guide profile on BTG'],
            ['key' => 'field_blog_hero_image', 'label' => 'Hero Image', 'name' => 'hero_image', 'type' => 'image', 'return_format' => 'array'],
            ['key' => 'field_blog_faq', 'label' => 'FAQ Items', 'name' => 'faq_items', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_blog_faq_q', 'label' => 'Question', 'name' => 'question', 'type' => 'text'],
                ['key' => 'field_blog_faq_a', 'label' => 'Answer', 'name' => 'answer', 'type' => 'wysiwyg', 'media_upload' => 0],
            ]],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'post']]],
        'show_in_graphql' => false,
    ]);

    // ── State Hub Fields ──
    acf_add_local_field_group([
        'key'      => 'group_btg_state_hub',
        'title'    => 'State Hub Fields',
        'fields'   => [
            ['key' => 'field_sh_state_slug', 'label' => 'State Slug', 'name' => 'state_slug', 'type' => 'text', 'required' => 1, 'instructions' => 'Must match Next.js state slug exactly (e.g. "uttarakhand", "himachal-pradesh")'],
            ['key' => 'field_sh_tagline', 'label' => 'Tagline', 'name' => 'tagline', 'type' => 'text', 'instructions' => 'Short tagline (max 120 chars)'],
            ['key' => 'field_sh_hero_desc', 'label' => 'Hero Description', 'name' => 'hero_description', 'type' => 'textarea', 'instructions' => 'Replaces the default state description on the hero section'],
            ['key' => 'field_sh_hero_image', 'label' => 'Hero Image', 'name' => 'hero_image', 'type' => 'image', 'return_format' => 'array'],
            ['key' => 'field_sh_best_time', 'label' => 'Best Time to Visit', 'name' => 'best_time_to_visit', 'type' => 'text'],
            ['key' => 'field_sh_highlights', 'label' => 'Highlights', 'name' => 'highlights', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_sh_highlight_item', 'label' => 'Highlight', 'name' => 'item', 'type' => 'text'],
            ]],
            ['key' => 'field_sh_overview', 'label' => 'Overview Content', 'name' => 'overview_content', 'type' => 'wysiwyg', 'instructions' => 'Long-form SEO content about the state. Rendered below the hero section.'],
            ['key' => 'field_sh_why_book', 'label' => 'Why Book a Guide', 'name' => 'why_book_guide', 'type' => 'wysiwyg'],
            ['key' => 'field_sh_travel_tips', 'label' => 'Travel Tips', 'name' => 'travel_tips', 'type' => 'wysiwyg'],
            ['key' => 'field_sh_faq', 'label' => 'FAQ Items', 'name' => 'faq_items', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_sh_faq_q', 'label' => 'Question', 'name' => 'question', 'type' => 'text'],
                ['key' => 'field_sh_faq_a', 'label' => 'Answer', 'name' => 'answer', 'type' => 'wysiwyg', 'media_upload' => 0],
            ]],
            ['key' => 'field_sh_related_states', 'label' => 'Related States', 'name' => 'related_states', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_sh_related_state', 'label' => 'State Slug', 'name' => 'slug', 'type' => 'text'],
            ]],
            ['key' => 'field_sh_internal_links', 'label' => 'Internal Links', 'name' => 'internal_links', 'type' => 'repeater', 'instructions' => 'SEO-important internal links to display at the bottom of the page', 'sub_fields' => [
                ['key' => 'field_sh_link_label', 'label' => 'Label', 'name' => 'label', 'type' => 'text'],
                ['key' => 'field_sh_link_url', 'label' => 'URL', 'name' => 'url', 'type' => 'url'],
                ['key' => 'field_sh_link_desc', 'label' => 'Description', 'name' => 'description', 'type' => 'text'],
            ]],
            ['key' => 'field_sh_content_blocks', 'label' => 'Content Blocks', 'name' => 'content_blocks', 'type' => 'repeater', 'instructions' => 'Key-value content blocks to override section headings, descriptions, CTAs etc. See docs for valid keys.', 'button_label' => 'Add Content Block', 'sub_fields' => [
                ['key' => 'field_sh_cb_key', 'label' => 'Block Key', 'name' => 'block_key', 'type' => 'text', 'required' => 1, 'instructions' => 'Unique key e.g. discover_title, discover_description, cta_title'],
                ['key' => 'field_sh_cb_value', 'label' => 'Block Value', 'name' => 'block_value', 'type' => 'wysiwyg', 'media_upload' => 0, 'instructions' => 'HTML content for this block'],
            ]],
            ['key' => 'field_sh_content_images', 'label' => 'Content Images', 'name' => 'content_images', 'type' => 'repeater', 'instructions' => 'Key-value image blocks to override section images.', 'button_label' => 'Add Content Image', 'sub_fields' => [
                ['key' => 'field_sh_ci_key', 'label' => 'Image Key', 'name' => 'image_key', 'type' => 'text', 'required' => 1],
                ['key' => 'field_sh_ci_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array'],
            ]],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'state_hub']]],
        'show_in_graphql' => false,
    ]);

    // ── Category Landing Fields ──
    acf_add_local_field_group([
        'key'      => 'group_btg_category_landing',
        'title'    => 'Category Landing Fields',
        'fields'   => [
            ['key' => 'field_cl_cat_slug', 'label' => 'Category Slug', 'name' => 'category_slug', 'type' => 'text', 'required' => 1, 'instructions' => 'Must match URL slug (e.g. "tourist-guides", "group-trips")'],
            ['key' => 'field_cl_tagline', 'label' => 'Tagline', 'name' => 'tagline', 'type' => 'text'],
            ['key' => 'field_cl_hero_desc', 'label' => 'Hero Description', 'name' => 'hero_description', 'type' => 'textarea'],
            ['key' => 'field_cl_hero_image', 'label' => 'Hero Image', 'name' => 'hero_image', 'type' => 'image', 'return_format' => 'array'],
            ['key' => 'field_cl_why', 'label' => 'Why This Experience', 'name' => 'why_this_experience', 'type' => 'wysiwyg'],
            ['key' => 'field_cl_expect', 'label' => 'What to Expect', 'name' => 'what_to_expect', 'type' => 'wysiwyg'],
            ['key' => 'field_cl_faq', 'label' => 'FAQ Items', 'name' => 'faq_items', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_cl_faq_q', 'label' => 'Question', 'name' => 'question', 'type' => 'text'],
                ['key' => 'field_cl_faq_a', 'label' => 'Answer', 'name' => 'answer', 'type' => 'wysiwyg', 'media_upload' => 0],
            ]],
            ['key' => 'field_cl_seo_block', 'label' => 'SEO Content Block', 'name' => 'seo_content_block', 'type' => 'wysiwyg', 'instructions' => 'Long-tail keyword content for SEO'],
            ['key' => 'field_cl_internal_links', 'label' => 'Internal Links', 'name' => 'internal_links', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_cl_link_label', 'label' => 'Label', 'name' => 'label', 'type' => 'text'],
                ['key' => 'field_cl_link_url', 'label' => 'URL', 'name' => 'url', 'type' => 'url'],
                ['key' => 'field_cl_link_desc', 'label' => 'Description', 'name' => 'description', 'type' => 'text'],
            ]],
            ['key' => 'field_cl_content_blocks', 'label' => 'Content Blocks', 'name' => 'content_blocks', 'type' => 'repeater', 'instructions' => 'Key-value content blocks for editable section text.', 'button_label' => 'Add Content Block', 'sub_fields' => [
                ['key' => 'field_cl_cb_key', 'label' => 'Block Key', 'name' => 'block_key', 'type' => 'text', 'required' => 1],
                ['key' => 'field_cl_cb_value', 'label' => 'Block Value', 'name' => 'block_value', 'type' => 'wysiwyg', 'media_upload' => 0],
            ]],
            ['key' => 'field_cl_content_images', 'label' => 'Content Images', 'name' => 'content_images', 'type' => 'repeater', 'button_label' => 'Add Content Image', 'sub_fields' => [
                ['key' => 'field_cl_ci_key', 'label' => 'Image Key', 'name' => 'image_key', 'type' => 'text', 'required' => 1],
                ['key' => 'field_cl_ci_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array'],
            ]],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'category_landing']]],
        'show_in_graphql' => false,
    ]);

    // ── State × Category Fields ──
    acf_add_local_field_group([
        'key'      => 'group_btg_state_category',
        'title'    => 'State × Category Fields',
        'fields'   => [
            ['key' => 'field_sc_state_slug', 'label' => 'State Slug', 'name' => 'state_slug', 'type' => 'text', 'required' => 1],
            ['key' => 'field_sc_cat_slug', 'label' => 'Category Slug', 'name' => 'category_slug', 'type' => 'text', 'required' => 1],
            ['key' => 'field_sc_tagline', 'label' => 'Tagline', 'name' => 'tagline', 'type' => 'text'],
            ['key' => 'field_sc_hero_desc', 'label' => 'Hero Description', 'name' => 'hero_description', 'type' => 'textarea'],
            ['key' => 'field_sc_hero_image', 'label' => 'Hero Image', 'name' => 'hero_image', 'type' => 'image', 'return_format' => 'array'],
            ['key' => 'field_sc_overview', 'label' => 'Overview', 'name' => 'overview', 'type' => 'wysiwyg'],
            ['key' => 'field_sc_faq', 'label' => 'FAQ Items', 'name' => 'faq_items', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_sc_faq_q', 'label' => 'Question', 'name' => 'question', 'type' => 'text'],
                ['key' => 'field_sc_faq_a', 'label' => 'Answer', 'name' => 'answer', 'type' => 'wysiwyg', 'media_upload' => 0],
            ]],
            ['key' => 'field_sc_seo_block', 'label' => 'SEO Content Block', 'name' => 'seo_content_block', 'type' => 'wysiwyg'],
            ['key' => 'field_sc_internal_links', 'label' => 'Internal Links', 'name' => 'internal_links', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_sc_link_label', 'label' => 'Label', 'name' => 'label', 'type' => 'text'],
                ['key' => 'field_sc_link_url', 'label' => 'URL', 'name' => 'url', 'type' => 'url'],
                ['key' => 'field_sc_link_desc', 'label' => 'Description', 'name' => 'description', 'type' => 'text'],
            ]],
            ['key' => 'field_sc_content_blocks', 'label' => 'Content Blocks', 'name' => 'content_blocks', 'type' => 'repeater', 'instructions' => 'Key-value content blocks for editable section text.', 'button_label' => 'Add Content Block', 'sub_fields' => [
                ['key' => 'field_sc_cb_key', 'label' => 'Block Key', 'name' => 'block_key', 'type' => 'text', 'required' => 1],
                ['key' => 'field_sc_cb_value', 'label' => 'Block Value', 'name' => 'block_value', 'type' => 'wysiwyg', 'media_upload' => 0],
            ]],
            ['key' => 'field_sc_content_images', 'label' => 'Content Images', 'name' => 'content_images', 'type' => 'repeater', 'button_label' => 'Add Content Image', 'sub_fields' => [
                ['key' => 'field_sc_ci_key', 'label' => 'Image Key', 'name' => 'image_key', 'type' => 'text', 'required' => 1],
                ['key' => 'field_sc_ci_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array'],
            ]],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'state_category']]],
        'show_in_graphql' => false,
    ]);

    // ── Trip Fields (for individual package/experience SEO) ──
    acf_add_local_field_group([
        'key'      => 'group_btg_trip',
        'title'    => 'Trip Fields',
        'fields'   => [
            ['key' => 'field_trip_slug', 'label' => 'Trip Slug', 'name' => 'trip_slug', 'type' => 'text', 'required' => 1, 'instructions' => 'Must match the product slug in the database (e.g. "coorg-coffee-trail")'],
            ['key' => 'field_trip_seo_title', 'label' => 'SEO Title', 'name' => 'seo_title', 'type' => 'text', 'instructions' => 'Custom page title for SEO. Falls back to product title if empty.'],
            ['key' => 'field_trip_seo_desc', 'label' => 'SEO Description', 'name' => 'seo_description', 'type' => 'textarea', 'instructions' => 'Custom meta description for SEO.'],
            ['key' => 'field_trip_hero_desc', 'label' => 'Hero Description', 'name' => 'hero_description', 'type' => 'textarea', 'instructions' => 'Marketing description shown at the top of the trip page.'],
            ['key' => 'field_trip_hero_image', 'label' => 'Hero Image', 'name' => 'hero_image', 'type' => 'image', 'return_format' => 'array'],
            ['key' => 'field_trip_overview', 'label' => 'Overview Content', 'name' => 'overview', 'type' => 'wysiwyg', 'instructions' => 'Long-form content about the trip for SEO.'],
            ['key' => 'field_trip_faq', 'label' => 'FAQ Items', 'name' => 'faq_items', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_trip_faq_q', 'label' => 'Question', 'name' => 'question', 'type' => 'text'],
                ['key' => 'field_trip_faq_a', 'label' => 'Answer', 'name' => 'answer', 'type' => 'wysiwyg', 'media_upload' => 0],
            ]],
            ['key' => 'field_trip_seo_block', 'label' => 'SEO Content Block', 'name' => 'seo_content_block', 'type' => 'wysiwyg', 'instructions' => 'Long-tail keyword content for SEO'],
            ['key' => 'field_trip_internal_links', 'label' => 'Internal Links', 'name' => 'internal_links', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_trip_link_label', 'label' => 'Label', 'name' => 'label', 'type' => 'text'],
                ['key' => 'field_trip_link_url', 'label' => 'URL', 'name' => 'url', 'type' => 'url'],
                ['key' => 'field_trip_link_desc', 'label' => 'Description', 'name' => 'description', 'type' => 'text'],
            ]],
            ['key' => 'field_trip_content_blocks', 'label' => 'Content Blocks', 'name' => 'content_blocks', 'type' => 'repeater', 'button_label' => 'Add Content Block', 'sub_fields' => [
                ['key' => 'field_trip_cb_key', 'label' => 'Block Key', 'name' => 'block_key', 'type' => 'text', 'required' => 1],
                ['key' => 'field_trip_cb_value', 'label' => 'Block Value', 'name' => 'block_value', 'type' => 'wysiwyg', 'media_upload' => 0],
            ]],
            ['key' => 'field_trip_content_images', 'label' => 'Content Images', 'name' => 'content_images', 'type' => 'repeater', 'button_label' => 'Add Content Image', 'sub_fields' => [
                ['key' => 'field_trip_ci_key', 'label' => 'Image Key', 'name' => 'image_key', 'type' => 'text', 'required' => 1],
                ['key' => 'field_trip_ci_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array'],
            ]],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'btg_trip']]],
        'show_in_graphql' => false,
    ]);

    // ── Page Config Fields (UI Manager display settings) ──
    acf_add_local_field_group([
        'key'      => 'group_btg_page_config',
        'title'    => 'Page Display Configuration',
        'fields'   => [
            ['key' => 'field_pc_page_slug', 'label' => 'Page Slug', 'name' => 'page_slug', 'type' => 'text', 'required' => 1, 'instructions' => 'Page identifier (e.g. "home", "group-trips", "destinations", "explore/himachal-pradesh")'],
            ['key' => 'field_pc_section_order', 'label' => 'Section Display Order', 'name' => 'section_order', 'type' => 'repeater', 'instructions' => 'Order in which sections appear on the page. Lower position = displayed first.', 'sub_fields' => [
                ['key' => 'field_pc_so_key', 'label' => 'Section Key', 'name' => 'section_key', 'type' => 'text', 'instructions' => 'e.g. trending, recommended, all_trips, featured_guides'],
                ['key' => 'field_pc_so_visible', 'label' => 'Visible', 'name' => 'visible', 'type' => 'true_false', 'default_value' => 1],
                ['key' => 'field_pc_so_sort', 'label' => 'Sort By', 'name' => 'sort_by', 'type' => 'select', 'choices' => ['default' => 'Default', 'rating' => 'Highest Rated', 'bookings' => 'Most Booked', 'newest' => 'Newest First', 'price_low' => 'Price Low→High', 'price_high' => 'Price High→Low'], 'default_value' => 'default'],
                ['key' => 'field_pc_so_limit', 'label' => 'Items to Show', 'name' => 'limit', 'type' => 'number', 'default_value' => 4, 'min' => 1, 'max' => 50],
            ]],
            ['key' => 'field_pc_featured_ids', 'label' => 'Featured Item IDs', 'name' => 'featured_ids', 'type' => 'repeater', 'instructions' => 'Manually pick which items appear first in key sections. Use product slugs or IDs.', 'sub_fields' => [
                ['key' => 'field_pc_fi_section', 'label' => 'Section', 'name' => 'section', 'type' => 'text'],
                ['key' => 'field_pc_fi_item_id', 'label' => 'Item Slug/ID', 'name' => 'item_id', 'type' => 'text'],
                ['key' => 'field_pc_fi_position', 'label' => 'Position', 'name' => 'position', 'type' => 'number', 'default_value' => 1],
            ]],
            ['key' => 'field_pc_display_settings', 'label' => 'Display Settings', 'name' => 'display_settings', 'type' => 'repeater', 'instructions' => 'Key-value display configuration.', 'sub_fields' => [
                ['key' => 'field_pc_ds_key', 'label' => 'Setting Key', 'name' => 'setting_key', 'type' => 'text'],
                ['key' => 'field_pc_ds_value', 'label' => 'Setting Value', 'name' => 'setting_value', 'type' => 'text'],
            ]],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'page_config']]],
        'show_in_graphql' => false,
    ]);

    // ── Page Sections (for About, Terms, etc.) ──
    acf_add_local_field_group([
        'key'      => 'group_btg_page_sections',
        'title'    => 'Page Sections',
        'fields'   => [
            ['key' => 'field_page_sections', 'label' => 'Content Sections', 'name' => 'sections', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_ps_heading', 'label' => 'Heading', 'name' => 'heading', 'type' => 'text'],
                ['key' => 'field_ps_body', 'label' => 'Body', 'name' => 'body', 'type' => 'wysiwyg'],
                ['key' => 'field_ps_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array'],
            ]],
            ['key' => 'field_page_faq', 'label' => 'FAQ Items', 'name' => 'faq_items', 'type' => 'repeater', 'sub_fields' => [
                ['key' => 'field_page_faq_q', 'label' => 'Question', 'name' => 'question', 'type' => 'text'],
                ['key' => 'field_page_faq_a', 'label' => 'Answer', 'name' => 'answer', 'type' => 'wysiwyg', 'media_upload' => 0],
            ]],
            ['key' => 'field_page_seo_block', 'label' => 'SEO Content Block', 'name' => 'seo_content_block', 'type' => 'wysiwyg', 'instructions' => 'Long-form content for SEO. Rendered below the main page content.'],
            ['key' => 'field_page_internal_links', 'label' => 'Internal Links', 'name' => 'internal_links', 'type' => 'repeater', 'instructions' => 'SEO-important internal links', 'sub_fields' => [
                ['key' => 'field_page_link_label', 'label' => 'Label', 'name' => 'label', 'type' => 'text'],
                ['key' => 'field_page_link_url', 'label' => 'URL', 'name' => 'url', 'type' => 'url'],
                ['key' => 'field_page_link_desc', 'label' => 'Description', 'name' => 'description', 'type' => 'text'],
            ]],
            // ── Content Blocks: key-value text blocks for all page content ──
            ['key' => 'field_page_content_blocks', 'label' => 'Content Blocks', 'name' => 'content_blocks', 'type' => 'repeater',
             'instructions' => 'Editable text blocks for the page. Each block has a key (e.g. hero_title, hero_subtitle) and a value. See the reference list in the page description for available keys.',
             'sub_fields' => [
                ['key' => 'field_cb_key', 'label' => 'Block Key', 'name' => 'block_key', 'type' => 'text', 'instructions' => 'Unique identifier (e.g. hero_title, cta_text, feature_1_title)'],
                ['key' => 'field_cb_value', 'label' => 'Block Value', 'name' => 'block_value', 'type' => 'wysiwyg', 'instructions' => 'The content for this block. Supports rich text.', 'media_upload' => 0],
            ]],
            // ── Content Images: key-value image blocks ──
            ['key' => 'field_page_content_images', 'label' => 'Content Images', 'name' => 'content_images', 'type' => 'repeater',
             'instructions' => 'Editable images for the page. Each image has a key (e.g. hero_image, gallery_1) and an uploaded image.',
             'sub_fields' => [
                ['key' => 'field_ci_key', 'label' => 'Image Key', 'name' => 'image_key', 'type' => 'text', 'instructions' => 'Unique identifier (e.g. hero_image, banner_image)'],
                ['key' => 'field_ci_image', 'label' => 'Image', 'name' => 'image', 'type' => 'image', 'return_format' => 'array'],
            ]],
            // ── Reviews: editable testimonials ──
            ['key' => 'field_page_reviews', 'label' => 'Reviews / Testimonials', 'name' => 'reviews', 'type' => 'repeater',
             'instructions' => 'Customer reviews/testimonials displayed on the page.',
             'sub_fields' => [
                ['key' => 'field_rv_name', 'label' => 'Name', 'name' => 'name', 'type' => 'text'],
                ['key' => 'field_rv_location', 'label' => 'Location', 'name' => 'location', 'type' => 'text'],
                ['key' => 'field_rv_rating', 'label' => 'Rating (1-5)', 'name' => 'rating', 'type' => 'number', 'min' => 1, 'max' => 5],
                ['key' => 'field_rv_text', 'label' => 'Review Text', 'name' => 'text', 'type' => 'textarea'],
                ['key' => 'field_rv_trip', 'label' => 'Trip Name', 'name' => 'trip', 'type' => 'text'],
                ['key' => 'field_rv_avatar', 'label' => 'Avatar Image', 'name' => 'avatar', 'type' => 'image', 'return_format' => 'array'],
            ]],
            // ── Gallery Images ──
            ['key' => 'field_page_gallery', 'label' => 'Gallery Images', 'name' => 'gallery_images', 'type' => 'gallery', 'return_format' => 'array',
             'instructions' => 'Image gallery displayed on the page.'],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'page']]],
        'show_in_graphql' => false,
    ]);
});


// ═══════════════════════════════════════════════════════════
//  3. WEBHOOK: Trigger Next.js ISR Revalidation on Publish
// ═══════════════════════════════════════════════════════════

add_action('transition_post_status', function ($new_status, $old_status, $post) {
    // Only fire when a post is published, updated, or unpublished
    $trigger_statuses = ['publish', 'draft', 'trash'];
    if (!in_array($new_status, $trigger_statuses) && !in_array($old_status, $trigger_statuses)) {
        return;
    }

    $secret   = defined('BTG_REVALIDATION_SECRET') ? BTG_REVALIDATION_SECRET : '';
    $base_url = defined('BTG_NEXT_URL') ? BTG_NEXT_URL : 'https://www.booktheguide.com';

    if (empty($secret)) return;

    $post_type = get_post_type($post);
    $slug      = $post->post_name;

    wp_remote_post($base_url . '/api/revalidate', [
        'timeout' => 10,
        'body'    => wp_json_encode([
            'secret' => $secret,
            'type'   => $post_type,
            'slug'   => $slug,
        ]),
        'headers' => ['Content-Type' => 'application/json'],
    ]);
}, 10, 3);


// ═══════════════════════════════════════════════════════════
//  4. PREVIEW URL: Point WP "Preview" to Next.js preview endpoint
// ═══════════════════════════════════════════════════════════

add_filter('preview_post_link', function ($preview_link, $post) {
    $base_url = defined('BTG_NEXT_URL') ? BTG_NEXT_URL : 'https://www.booktheguide.com';
    $secret   = defined('BTG_PREVIEW_SECRET') ? BTG_PREVIEW_SECRET : '';

    if (empty($secret)) return $preview_link;

    $post_type = get_post_type($post);
    $slug      = $post->post_name;

    return add_query_arg([
        'secret' => $secret,
        'slug'   => $slug,
        'type'   => $post_type,
    ], $base_url . '/api/preview');
}, 10, 2);


// ═══════════════════════════════════════════════════════════
//  5. DISABLE FRONTEND (Headless mode — redirect to Next.js)
// ═══════════════════════════════════════════════════════════

add_action('template_redirect', function () {
    if (is_admin() || wp_doing_cron() || wp_doing_ajax() || (defined('GRAPHQL_REQUEST') && GRAPHQL_REQUEST)) {
        return;
    }

    $base_url = defined('BTG_NEXT_URL') ? BTG_NEXT_URL : 'https://www.booktheguide.com';
    wp_redirect($base_url, 301);
    exit;
});


// ═══════════════════════════════════════════════════════════
//  6. ADMIN CUSTOMIZATIONS
// ═══════════════════════════════════════════════════════════

// Custom admin menu order
add_filter('custom_menu_order', '__return_true');
add_filter('menu_order', function ($menu_order) {
    return [
        'index.php',           // Dashboard
        'separator1',
        'edit.php',            // Blog Posts
        'edit.php?post_type=state_hub',
        'edit.php?post_type=category_landing',
        'edit.php?post_type=state_category',
        'edit.php?post_type=btg_trip',
        'edit.php?post_type=page_config',
        'edit.php?post_type=page',
        'upload.php',          // Media
        'separator2',
    ];
});

// Add BTG branding to admin
add_action('admin_head', function () {
    echo '<style>
        #adminmenu .wp-menu-image img { padding: 6px 0 0 0 !important; }
        .wrap h1 { font-family: "Plus Jakarta Sans", sans-serif !important; }
    </style>';
});


// ═══════════════════════════════════════════════════════════
//  7. WPGRAPHQL CUSTOM FIELD REGISTRATION
//     ACF Free doesn't expose fields to GraphQL automatically.
//     We register each field directly using register_graphql_field().
//     ACF handles the admin UI; we read post meta in the resolver.
// ═══════════════════════════════════════════════════════════

add_action('graphql_register_types', function () {

    // ── Shared object types ──────────────────────────────

    register_graphql_object_type('BTGFaqItem', [
        'description' => 'FAQ question/answer pair',
        'fields' => [
            'question' => ['type' => 'String'],
            'answer'   => ['type' => 'String'],
        ],
    ]);

    register_graphql_object_type('BTGInternalLink', [
        'description' => 'Internal SEO link',
        'fields' => [
            'label'       => ['type' => 'String'],
            'url'         => ['type' => 'String'],
            'description' => ['type' => 'String'],
        ],
    ]);

    register_graphql_object_type('BTGMediaItem', [
        'description' => 'Image with URL and alt text',
        'fields' => [
            'sourceUrl' => ['type' => 'String'],
            'altText'   => ['type' => 'String'],
        ],
    ]);

    register_graphql_object_type('BTGPageSection', [
        'description' => 'Page content section',
        'fields' => [
            'heading' => ['type' => 'String'],
            'body'    => ['type' => 'String'],
            'image'   => ['type' => 'BTGMediaItem'],
        ],
    ]);

    // ── Custom field group types ─────────────────────────

    register_graphql_object_type('BTGStateHubFields', [
        'description' => 'ACF fields for State Hub post type',
        'fields' => [
            'stateSlug'       => ['type' => 'String'],
            'tagline'         => ['type' => 'String'],
            'heroDescription' => ['type' => 'String'],
            'heroImage'       => ['type' => 'BTGMediaItem'],
            'bestTimeToVisit' => ['type' => 'String'],
            'highlights'      => ['type' => ['list_of' => 'String']],
            'overviewContent' => ['type' => 'String'],
            'whyBookGuide'    => ['type' => 'String'],
            'travelTips'      => ['type' => 'String'],
            'faqItems'        => ['type' => ['list_of' => 'BTGFaqItem']],
            'relatedStates'   => ['type' => ['list_of' => 'String']],
            'internalLinks'   => ['type' => ['list_of' => 'BTGInternalLink']],
            'contentBlocks'   => ['type' => ['list_of' => 'BTGContentBlock']],
            'contentImages'   => ['type' => ['list_of' => 'BTGContentImage']],
        ],
    ]);

    register_graphql_object_type('BTGCategoryLandingFields', [
        'description' => 'ACF fields for Category Landing post type',
        'fields' => [
            'categorySlug'      => ['type' => 'String'],
            'tagline'           => ['type' => 'String'],
            'heroDescription'   => ['type' => 'String'],
            'heroImage'         => ['type' => 'BTGMediaItem'],
            'whyThisExperience' => ['type' => 'String'],
            'whatToExpect'      => ['type' => 'String'],
            'faqItems'          => ['type' => ['list_of' => 'BTGFaqItem']],
            'seoContentBlock'   => ['type' => 'String'],
            'internalLinks'     => ['type' => ['list_of' => 'BTGInternalLink']],
            'contentBlocks'     => ['type' => ['list_of' => 'BTGContentBlock']],
            'contentImages'     => ['type' => ['list_of' => 'BTGContentImage']],
        ],
    ]);

    register_graphql_object_type('BTGStateCategoryFields', [
        'description' => 'ACF fields for State×Category post type',
        'fields' => [
            'stateSlug'       => ['type' => 'String'],
            'categorySlug'    => ['type' => 'String'],
            'tagline'         => ['type' => 'String'],
            'heroDescription' => ['type' => 'String'],
            'heroImage'       => ['type' => 'BTGMediaItem'],
            'overview'        => ['type' => 'String'],
            'faqItems'        => ['type' => ['list_of' => 'BTGFaqItem']],
            'seoContentBlock' => ['type' => 'String'],
            'internalLinks'   => ['type' => ['list_of' => 'BTGInternalLink']],
            'contentBlocks'   => ['type' => ['list_of' => 'BTGContentBlock']],
            'contentImages'   => ['type' => ['list_of' => 'BTGContentImage']],
        ],
    ]);

    register_graphql_object_type('BTGBlogFields', [
        'description' => 'ACF fields for Blog Posts',
        'fields' => [
            'readTime'         => ['type' => 'String'],
            'destination'      => ['type' => 'String'],
            'state'            => ['type' => 'String'],
            'relatedGuideSlug' => ['type' => 'String'],
            'heroImage'        => ['type' => 'BTGMediaItem'],
            'faqItems'         => ['type' => ['list_of' => 'BTGFaqItem']],
        ],
    ]);

    register_graphql_object_type('BTGTripFields', [
        'description' => 'ACF fields for Trip post type',
        'fields' => [
            'tripSlug'        => ['type' => 'String'],
            'seoTitle'        => ['type' => 'String'],
            'seoDescription'  => ['type' => 'String'],
            'heroDescription' => ['type' => 'String'],
            'heroImage'       => ['type' => 'BTGMediaItem'],
            'overview'        => ['type' => 'String'],
            'faqItems'        => ['type' => ['list_of' => 'BTGFaqItem']],
            'seoContentBlock' => ['type' => 'String'],
            'internalLinks'   => ['type' => ['list_of' => 'BTGInternalLink']],
            'contentBlocks'   => ['type' => ['list_of' => 'BTGContentBlock']],
            'contentImages'   => ['type' => ['list_of' => 'BTGContentImage']],
        ],
    ]);

    register_graphql_object_type('BTGSectionOrder', [
        'description' => 'Section display order config',
        'fields' => [
            'sectionKey' => ['type' => 'String'],
            'visible'    => ['type' => 'Boolean'],
            'sortBy'     => ['type' => 'String'],
            'limit'      => ['type' => 'Int'],
        ],
    ]);

    register_graphql_object_type('BTGFeaturedItem', [
        'description' => 'Featured item for a section',
        'fields' => [
            'section'  => ['type' => 'String'],
            'itemId'   => ['type' => 'String'],
            'position' => ['type' => 'Int'],
        ],
    ]);

    register_graphql_object_type('BTGDisplaySetting', [
        'description' => 'Key-value display setting',
        'fields' => [
            'settingKey'   => ['type' => 'String'],
            'settingValue' => ['type' => 'String'],
        ],
    ]);

    register_graphql_object_type('BTGPageConfigFields', [
        'description' => 'ACF fields for Page Config',
        'fields' => [
            'pageSlug'        => ['type' => 'String'],
            'sectionOrder'    => ['type' => ['list_of' => 'BTGSectionOrder']],
            'featuredIds'     => ['type' => ['list_of' => 'BTGFeaturedItem']],
            'displaySettings' => ['type' => ['list_of' => 'BTGDisplaySetting']],
        ],
    ]);

    register_graphql_object_type('BTGPageFields', [
        'description' => 'ACF section fields for Pages',
        'fields' => [
            'sections'        => ['type' => ['list_of' => 'BTGPageSection']],
            'faqItems'        => ['type' => ['list_of' => 'BTGFaqItem']],
            'seoContentBlock' => ['type' => 'String'],
            'internalLinks'   => ['type' => ['list_of' => 'BTGInternalLink']],
            'contentBlocks'   => ['type' => ['list_of' => 'BTGContentBlock']],
            'contentImages'   => ['type' => ['list_of' => 'BTGContentImage']],
            'reviews'         => ['type' => ['list_of' => 'BTGReview']],
            'galleryImages'   => ['type' => ['list_of' => 'BTGMediaItem']],
        ],
    ]);

    // ── Content block types for flexible page editing ────

    register_graphql_object_type('BTGContentBlock', [
        'description' => 'Key-value text/HTML content block',
        'fields' => [
            'blockKey'   => ['type' => 'String'],
            'blockValue' => ['type' => 'String'],
        ],
    ]);

    register_graphql_object_type('BTGContentImage', [
        'description' => 'Key-value image content block',
        'fields' => [
            'imageKey' => ['type' => 'String'],
            'image'    => ['type' => 'BTGMediaItem'],
        ],
    ]);

    register_graphql_object_type('BTGReview', [
        'description' => 'Customer review/testimonial',
        'fields' => [
            'name'     => ['type' => 'String'],
            'location' => ['type' => 'String'],
            'rating'   => ['type' => 'Int'],
            'text'     => ['type' => 'String'],
            'trip'     => ['type' => 'String'],
            'avatar'   => ['type' => 'BTGMediaItem'],
        ],
    ]);

    // ── Helper: resolve ACF repeater from post meta ───────
    // ACF stores repeaters as: field_name = count,
    // field_name_0_subfield, field_name_1_subfield, etc.

    $resolve_faq = function ($post_id, $prefix = 'faq_items') {
        $count = (int) get_post_meta($post_id, $prefix, true);
        $items = [];
        for ($i = 0; $i < $count; $i++) {
            $items[] = [
                'question' => get_post_meta($post_id, "{$prefix}_{$i}_question", true) ?: '',
                'answer'   => get_post_meta($post_id, "{$prefix}_{$i}_answer", true) ?: '',
            ];
        }
        return $items ?: null;
    };

    $resolve_links = function ($post_id, $prefix = 'internal_links') {
        $count = (int) get_post_meta($post_id, $prefix, true);
        $items = [];
        for ($i = 0; $i < $count; $i++) {
            $items[] = [
                'label'       => get_post_meta($post_id, "{$prefix}_{$i}_label", true) ?: '',
                'url'         => get_post_meta($post_id, "{$prefix}_{$i}_url", true) ?: '',
                'description' => get_post_meta($post_id, "{$prefix}_{$i}_description", true) ?: '',
            ];
        }
        return $items ?: null;
    };

    $resolve_image = function ($post_id, $meta_key = 'hero_image') {
        $img_id = get_post_meta($post_id, $meta_key, true);
        if (!$img_id) return null;
        return [
            'sourceUrl' => wp_get_attachment_url($img_id) ?: null,
            'altText'   => get_post_meta($img_id, '_wp_attachment_image_alt', true) ?: '',
        ];
    };

    $resolve_content_blocks = function ($post_id) {
        $count = (int) get_post_meta($post_id, 'content_blocks', true);
        $blocks = [];
        for ($i = 0; $i < $count; $i++) {
            $key = get_post_meta($post_id, "content_blocks_{$i}_block_key", true);
            $val = get_post_meta($post_id, "content_blocks_{$i}_block_value", true);
            if ($key) {
                $blocks[] = ['blockKey' => $key, 'blockValue' => $val ?: ''];
            }
        }
        return $blocks ?: null;
    };

    $resolve_content_images = function ($post_id) use ($resolve_image) {
        $count = (int) get_post_meta($post_id, 'content_images', true);
        $images = [];
        for ($i = 0; $i < $count; $i++) {
            $key = get_post_meta($post_id, "content_images_{$i}_image_key", true);
            $img = $resolve_image($post_id, "content_images_{$i}_image");
            if ($key) {
                $images[] = ['imageKey' => $key, 'image' => $img];
            }
        }
        return $images ?: null;
    };

    // ── Attach stateHubFields to StateHub ────────────────

    register_graphql_field('StateHub', 'stateHubFields', [
        'type'        => 'BTGStateHubFields',
        'description' => 'State Hub custom fields (ACF)',
        'resolve'     => function ($post) use ($resolve_faq, $resolve_links, $resolve_image, $resolve_content_blocks, $resolve_content_images) {
            $id = $post->databaseId;

            $highlights_count = (int) get_post_meta($id, 'highlights', true);
            $highlights = [];
            for ($i = 0; $i < $highlights_count; $i++) {
                $item = get_post_meta($id, "highlights_{$i}_item", true);
                if ($item) $highlights[] = $item;
            }

            $related_count = (int) get_post_meta($id, 'related_states', true);
            $related_states = [];
            for ($i = 0; $i < $related_count; $i++) {
                $slug = get_post_meta($id, "related_states_{$i}_slug", true);
                if ($slug) $related_states[] = $slug;
            }

            return [
                'stateSlug'       => get_post_meta($id, 'state_slug', true) ?: '',
                'tagline'         => get_post_meta($id, 'tagline', true) ?: '',
                'heroDescription' => get_post_meta($id, 'hero_description', true) ?: '',
                'heroImage'       => $resolve_image($id),
                'bestTimeToVisit' => get_post_meta($id, 'best_time_to_visit', true) ?: null,
                'highlights'      => $highlights ?: null,
                'overviewContent' => get_post_meta($id, 'overview_content', true) ?: null,
                'whyBookGuide'    => get_post_meta($id, 'why_book_guide', true) ?: null,
                'travelTips'      => get_post_meta($id, 'travel_tips', true) ?: null,
                'faqItems'        => $resolve_faq($id),
                'relatedStates'   => $related_states ?: null,
                'internalLinks'   => $resolve_links($id),
                'contentBlocks'   => call_user_func($resolve_content_blocks, $id),
                'contentImages'   => call_user_func($resolve_content_images, $id),
            ];
        },
    ]);

    // ── Attach categoryLandingFields to CategoryLanding ──

    register_graphql_field('CategoryLanding', 'categoryLandingFields', [
        'type'        => 'BTGCategoryLandingFields',
        'description' => 'Category Landing custom fields (ACF)',
        'resolve'     => function ($post) use ($resolve_faq, $resolve_links, $resolve_image) {
            $id = $post->databaseId;
            return [
                'categorySlug'      => get_post_meta($id, 'category_slug', true) ?: '',
                'tagline'           => get_post_meta($id, 'tagline', true) ?: '',
                'heroDescription'   => get_post_meta($id, 'hero_description', true) ?: '',
                'heroImage'         => $resolve_image($id),
                'whyThisExperience' => get_post_meta($id, 'why_this_experience', true) ?: null,
                'whatToExpect'      => get_post_meta($id, 'what_to_expect', true) ?: null,
                'faqItems'          => $resolve_faq($id),
                'seoContentBlock'   => get_post_meta($id, 'seo_content_block', true) ?: null,
                'internalLinks'     => $resolve_links($id),
                'contentBlocks'     => call_user_func($resolve_content_blocks, $id),
                'contentImages'     => call_user_func($resolve_content_images, $id),
            ];
        },
    ]);

    // ── Attach stateCategoryFields to StateCategory ──────

    register_graphql_field('StateCategory', 'stateCategoryFields', [
        'type'        => 'BTGStateCategoryFields',
        'description' => 'State×Category custom fields (ACF)',
        'resolve'     => function ($post) use ($resolve_faq, $resolve_links, $resolve_image) {
            $id = $post->databaseId;
            return [
                'stateSlug'       => get_post_meta($id, 'state_slug', true) ?: '',
                'categorySlug'    => get_post_meta($id, 'category_slug', true) ?: '',
                'tagline'         => get_post_meta($id, 'tagline', true) ?: '',
                'heroDescription' => get_post_meta($id, 'hero_description', true) ?: '',
                'heroImage'       => $resolve_image($id),
                'overview'        => get_post_meta($id, 'overview', true) ?: null,
                'faqItems'        => $resolve_faq($id),
                'seoContentBlock' => get_post_meta($id, 'seo_content_block', true) ?: null,
                'internalLinks'   => $resolve_links($id),                'contentBlocks'    => call_user_func($resolve_content_blocks, $id),
                'contentImages'    => call_user_func($resolve_content_images, $id),            ];
        },
    ]);

    // ── Attach blogFields to Post ─────────────────────────

    register_graphql_field('Post', 'blogFields', [
        'type'        => 'BTGBlogFields',
        'description' => 'Blog post custom fields (ACF)',
        'resolve'     => function ($post) use ($resolve_faq, $resolve_image) {
            $id = $post->databaseId;
            return [
                'readTime'         => get_post_meta($id, 'read_time', true) ?: null,
                'destination'      => get_post_meta($id, 'destination', true) ?: null,
                'state'            => get_post_meta($id, 'state', true) ?: null,
                'relatedGuideSlug' => get_post_meta($id, 'related_guide_slug', true) ?: null,
                'heroImage'        => $resolve_image($id),
                'faqItems'         => $resolve_faq($id),
            ];
        },
    ]);

    // ── Attach pageFields to Page ─────────────────────────

    register_graphql_field('Page', 'pageFields', [
        'type'        => 'BTGPageFields',
        'description' => 'Page section fields (ACF)',
        'resolve'     => function ($post) use ($resolve_image, $resolve_faq, $resolve_links) {
            $id = $post->databaseId;
            $count = (int) get_post_meta($id, 'sections', true);
            $sections = [];
            for ($i = 0; $i < $count; $i++) {
                $sections[] = [
                    'heading' => get_post_meta($id, "sections_{$i}_heading", true) ?: '',
                    'body'    => get_post_meta($id, "sections_{$i}_body", true) ?: '',
                    'image'   => $resolve_image($id, "sections_{$i}_image"),
                ];
            }

            // Resolve content blocks (key-value text)
            $cb_count = (int) get_post_meta($id, 'content_blocks', true);
            $content_blocks = [];
            for ($i = 0; $i < $cb_count; $i++) {
                $key = get_post_meta($id, "content_blocks_{$i}_block_key", true);
                $val = get_post_meta($id, "content_blocks_{$i}_block_value", true);
                if ($key) {
                    $content_blocks[] = [
                        'blockKey'   => $key,
                        'blockValue' => $val ?: '',
                    ];
                }
            }

            // Resolve content images (key-value images)
            $ci_count = (int) get_post_meta($id, 'content_images', true);
            $content_images = [];
            for ($i = 0; $i < $ci_count; $i++) {
                $key = get_post_meta($id, "content_images_{$i}_image_key", true);
                $img = $resolve_image($id, "content_images_{$i}_image");
                if ($key) {
                    $content_images[] = [
                        'imageKey' => $key,
                        'image'    => $img,
                    ];
                }
            }

            // Resolve reviews
            $rv_count = (int) get_post_meta($id, 'reviews', true);
            $reviews = [];
            for ($i = 0; $i < $rv_count; $i++) {
                $reviews[] = [
                    'name'     => get_post_meta($id, "reviews_{$i}_name", true) ?: '',
                    'location' => get_post_meta($id, "reviews_{$i}_location", true) ?: '',
                    'rating'   => (int) (get_post_meta($id, "reviews_{$i}_rating", true) ?: 5),
                    'text'     => get_post_meta($id, "reviews_{$i}_text", true) ?: '',
                    'trip'     => get_post_meta($id, "reviews_{$i}_trip", true) ?: '',
                    'avatar'   => $resolve_image($id, "reviews_{$i}_avatar"),
                ];
            }

            // Resolve gallery images
            $gallery_ids = get_post_meta($id, 'gallery_images', true);
            $gallery = [];
            if (is_array($gallery_ids)) {
                foreach ($gallery_ids as $img_id) {
                    $gallery[] = [
                        'sourceUrl' => wp_get_attachment_url($img_id) ?: null,
                        'altText'   => get_post_meta($img_id, '_wp_attachment_image_alt', true) ?: '',
                    ];
                }
            }

            return [
                'sections'        => $sections ?: null,
                'faqItems'        => $resolve_faq($id),
                'seoContentBlock' => get_post_meta($id, 'seo_content_block', true) ?: null,
                'internalLinks'   => $resolve_links($id),
                'contentBlocks'   => $content_blocks ?: null,
                'contentImages'   => $content_images ?: null,
                'reviews'         => $reviews ?: null,
                'galleryImages'   => $gallery ?: null,
            ];
        },
    ]);

    // ── Attach tripFields to BtgTrip ──────────────────────

    register_graphql_field('BtgTrip', 'tripFields', [
        'type'        => 'BTGTripFields',
        'description' => 'Trip custom fields (ACF)',
        'resolve'     => function ($post) use ($resolve_faq, $resolve_links, $resolve_image, $resolve_content_blocks, $resolve_content_images) {
            $id = $post->databaseId;
            return [
                'tripSlug'        => get_post_meta($id, 'trip_slug', true) ?: '',
                'seoTitle'        => get_post_meta($id, 'seo_title', true) ?: '',
                'seoDescription'  => get_post_meta($id, 'seo_description', true) ?: '',
                'heroDescription' => get_post_meta($id, 'hero_description', true) ?: '',
                'heroImage'       => $resolve_image($id),
                'overview'        => get_post_meta($id, 'overview', true) ?: null,
                'faqItems'        => $resolve_faq($id),
                'seoContentBlock' => get_post_meta($id, 'seo_content_block', true) ?: null,
                'internalLinks'   => $resolve_links($id),
                'contentBlocks'   => call_user_func($resolve_content_blocks, $id),
                'contentImages'   => call_user_func($resolve_content_images, $id),
            ];
        },
    ]);

    // ── Attach pageConfigFields to PageConfig ─────────────

    register_graphql_field('PageConfig', 'pageConfigFields', [
        'type'        => 'BTGPageConfigFields',
        'description' => 'Page config custom fields (ACF)',
        'resolve'     => function ($post) {
            $id = $post->databaseId;

            // Section order
            $so_count = (int) get_post_meta($id, 'section_order', true);
            $section_order = [];
            for ($i = 0; $i < $so_count; $i++) {
                $section_order[] = [
                    'sectionKey' => get_post_meta($id, "section_order_{$i}_section_key", true) ?: '',
                    'visible'    => (bool) get_post_meta($id, "section_order_{$i}_visible", true),
                    'sortBy'     => get_post_meta($id, "section_order_{$i}_sort_by", true) ?: 'default',
                    'limit'      => (int) (get_post_meta($id, "section_order_{$i}_limit", true) ?: 4),
                ];
            }

            // Featured IDs
            $fi_count = (int) get_post_meta($id, 'featured_ids', true);
            $featured = [];
            for ($i = 0; $i < $fi_count; $i++) {
                $featured[] = [
                    'section'  => get_post_meta($id, "featured_ids_{$i}_section", true) ?: '',
                    'itemId'   => get_post_meta($id, "featured_ids_{$i}_item_id", true) ?: '',
                    'position' => (int) (get_post_meta($id, "featured_ids_{$i}_position", true) ?: 1),
                ];
            }

            // Display settings
            $ds_count = (int) get_post_meta($id, 'display_settings', true);
            $settings = [];
            for ($i = 0; $i < $ds_count; $i++) {
                $settings[] = [
                    'settingKey'   => get_post_meta($id, "display_settings_{$i}_setting_key", true) ?: '',
                    'settingValue' => get_post_meta($id, "display_settings_{$i}_setting_value", true) ?: '',
                ];
            }

            return [
                'pageSlug'        => get_post_meta($id, 'page_slug', true) ?: '',
                'sectionOrder'    => $section_order ?: null,
                'featuredIds'     => $featured ?: null,
                'displaySettings' => $settings ?: null,
            ];
        },
    ]);
});
