<?php
/**
 * BTG Content Seeder — MU-Plugin
 *
 * Seeds all WordPress content (State Hubs, Category Landings, Trips, Pages, Posts)
 * when accessed via a secret URL token so Yoast SEO can manage every page.
 *
 * Usage: https://booktheguide-production.up.railway.app/?btg_seed=BTG_SEED_2026
 *
 * DELETE THIS FILE after first use.
 */

defined('ABSPATH') || exit;

add_action('init', function () {
    // Secret token — change after use
    $secret = 'BTG_SEED_2026';

    if (!isset($_GET['btg_seed']) || $_GET['btg_seed'] !== $secret) {
        return;
    }

    // Only run once — check if already done
    if (get_option('btg_seeder_done')) {
        wp_send_json(['status' => 'already_done', 'message' => 'Seeder already ran. Delete this mu-plugin.']);
    }

    header('Content-Type: application/json');
    $results = [];

    // ── HELPER: create_or_skip post ───────────────────────────────
    function btg_create_post($args) {
        $existing = get_posts([
            'post_type'   => $args['post_type'],
            'post_status' => 'any',
            'name'        => $args['post_name'],
            'numberposts' => 1,
        ]);
        if (!empty($existing)) {
            return ['action' => 'skipped', 'title' => $args['post_title'], 'id' => $existing[0]->ID];
        }
        $id = wp_insert_post(array_merge($args, ['post_status' => 'publish']), true);
        if (is_wp_error($id)) {
            return ['action' => 'error', 'title' => $args['post_title'], 'error' => $id->get_error_message()];
        }
        // Set meta
        if (!empty($args['meta'])) {
            foreach ($args['meta'] as $key => $value) {
                update_post_meta($id, $key, $value);
            }
        }
        return ['action' => 'created', 'title' => $args['post_title'], 'id' => $id];
    }

    // ── 1. STATE HUBS ─────────────────────────────────────────────
    $state_hubs = [
        ['slug' => 'himachal-pradesh', 'name' => 'Himachal Pradesh', 'tagline' => 'Dev Bhoomi — Land of the Gods', 'best_time' => 'March – June, September – November'],
        ['slug' => 'uttarakhand', 'name' => 'Uttarakhand', 'tagline' => 'Land of the Gods — Where the Himalayas Begin', 'best_time' => 'March – June, September – November'],
        ['slug' => 'kashmir', 'name' => 'Jammu & Kashmir', 'tagline' => 'Paradise on Earth', 'best_time' => 'March – November'],
        ['slug' => 'ladakh', 'name' => 'Ladakh', 'tagline' => 'The Last Shangri-La — Roof of the World', 'best_time' => 'June – September'],
        ['slug' => 'rajasthan', 'name' => 'Rajasthan', 'tagline' => 'Land of Kings — Where Heritage Comes Alive', 'best_time' => 'October – March'],
        ['slug' => 'delhi', 'name' => 'Delhi', 'tagline' => "Where India's Past Meets Its Future", 'best_time' => 'October – March'],
        ['slug' => 'uttar-pradesh', 'name' => 'Uttar Pradesh', 'tagline' => 'The Heartland of Indian Heritage', 'best_time' => 'October – March'],
        ['slug' => 'goa', 'name' => 'Goa', 'tagline' => 'Sun, Sand & Soul', 'best_time' => 'November – February'],
        ['slug' => 'kerala', 'name' => 'Kerala', 'tagline' => "God's Own Country", 'best_time' => 'September – March'],
        ['slug' => 'karnataka', 'name' => 'Karnataka', 'tagline' => 'One State, Many Worlds', 'best_time' => 'October – March'],
    ];
    foreach ($state_hubs as $s) {
        $results['state_hubs'][] = btg_create_post([
            'post_type'    => 'state_hub',
            'post_title'   => $s['name'],
            'post_name'    => $s['slug'],
            'post_content' => '<p>Explore ' . esc_html($s['name']) . ' with certified BTG local guides. ' . esc_html($s['tagline']) . '. Best time to visit: ' . esc_html($s['best_time']) . '.</p>',
            'meta'         => [
                'state_slug'       => $s['slug'],
                'tagline'          => $s['tagline'],
                'best_time_to_visit' => $s['best_time'],
            ],
        ]);
    }

    // ── 2. CATEGORY LANDINGS ──────────────────────────────────────
    $category_landings = [
        ['slug' => 'tourist-guides',             'name' => 'Tourist Guides',               'tagline' => 'Explore Every City Like a Local'],
        ['slug' => 'group-trips',                'name' => 'Group Trips',                  'tagline' => 'Travel Together, Create Memories'],
        ['slug' => 'adventure-guides',           'name' => 'Adventure Sports',             'tagline' => 'Raft, Climb, Paraglide with Certified Experts'],
        ['slug' => 'heritage-walks',             'name' => 'Heritage Walks',               'tagline' => 'Walk Through Living History'],
        ['slug' => 'travel-with-influencers',    'name' => 'Travel with Influencers',      'tagline' => "Explore India with Your Favourite Creators"],
        ['slug' => 'offbeat-travel',             'name' => 'Offbeat Travel',               'tagline' => "Discover India's Hidden Gems"],
        ['slug' => 'trekking',                   'name' => 'Trekking',                     'tagline' => "Conquer India's Greatest Trails"],
    ];
    foreach ($category_landings as $c) {
        $results['category_landings'][] = btg_create_post([
            'post_type'    => 'category_landing',
            'post_title'   => $c['name'],
            'post_name'    => $c['slug'],
            'post_content' => '<p>' . esc_html($c['tagline']) . '. Book BTG certified guides for ' . esc_html($c['name']) . ' experiences across India.</p>',
            'meta'         => [
                'category_slug' => $c['slug'],
                'tagline'       => $c['tagline'],
            ],
        ]);
    }

    // ── 3. STATE × CATEGORY ───────────────────────────────────────
    $state_categories = [
        ['slug' => 'himachal-pradesh-trekking',          'title' => 'Trekking in Himachal Pradesh',          'state' => 'himachal-pradesh', 'cat' => 'trekking'],
        ['slug' => 'himachal-pradesh-adventure-guides',  'title' => 'Adventure Sports in Himachal Pradesh',  'state' => 'himachal-pradesh', 'cat' => 'adventure-guides'],
        ['slug' => 'himachal-pradesh-tourist-guides',    'title' => 'Tourist Guides in Himachal Pradesh',    'state' => 'himachal-pradesh', 'cat' => 'tourist-guides'],
        ['slug' => 'uttarakhand-trekking',               'title' => 'Trekking in Uttarakhand',               'state' => 'uttarakhand',      'cat' => 'trekking'],
        ['slug' => 'uttarakhand-adventure-guides',       'title' => 'Adventure Sports in Uttarakhand',       'state' => 'uttarakhand',      'cat' => 'adventure-guides'],
        ['slug' => 'kashmir-trekking',                   'title' => 'Trekking in Kashmir',                   'state' => 'kashmir',          'cat' => 'trekking'],
        ['slug' => 'ladakh-trekking',                    'title' => 'Trekking in Ladakh',                    'state' => 'ladakh',           'cat' => 'trekking'],
        ['slug' => 'rajasthan-heritage-walks',           'title' => 'Heritage Walks in Rajasthan',           'state' => 'rajasthan',        'cat' => 'heritage-walks'],
        ['slug' => 'delhi-heritage-walks',               'title' => 'Heritage Walks in Delhi',               'state' => 'delhi',            'cat' => 'heritage-walks'],
        ['slug' => 'kerala-tourist-guides',              'title' => 'Tourist Guides in Kerala',              'state' => 'kerala',           'cat' => 'tourist-guides'],
        ['slug' => 'goa-tourist-guides',                 'title' => 'Tourist Guides in Goa',                 'state' => 'goa',              'cat' => 'tourist-guides'],
    ];
    foreach ($state_categories as $sc) {
        $results['state_categories'][] = btg_create_post([
            'post_type'    => 'state_category',
            'post_title'   => $sc['title'],
            'post_name'    => $sc['slug'],
            'post_content' => '<p>Book certified guides for ' . esc_html($sc['title']) . ' through Book The Guide.</p>',
            'meta'         => ['state_slug' => $sc['state'], 'category_slug' => $sc['cat']],
        ]);
    }

    // ── 4. TRIPS ──────────────────────────────────────────────────
    $trips = [
        // Himachal Pradesh
        ['slug' => 'triund-trek',           'title' => 'Triund Trek — Complete Guide & Booking 2026',                     'region' => 'himachal-pradesh'],
        ['slug' => 'kheerganga-trek',       'title' => 'Kheerganga Trek — Hot Springs & Parvati Valley 2026',             'region' => 'himachal-pradesh'],
        ['slug' => 'hampta-pass-trek',      'title' => 'Hampta Pass Trek — 4270m Himalayan Crossing 2026',               'region' => 'himachal-pradesh'],
        ['slug' => 'sar-pass-trek',         'title' => 'Sar Pass Trek — Snow Trek near Kasol 2026',                      'region' => 'himachal-pradesh'],
        ['slug' => 'spiti-valley-tour',     'title' => 'Spiti Valley Tour — Road Trip & Monasteries 2026',               'region' => 'himachal-pradesh'],
        ['slug' => 'dharamshala-tour',      'title' => 'Dharamshala Tour — McLeod Ganj & Tibetan Culture 2026',          'region' => 'himachal-pradesh'],
        // Uttarakhand
        ['slug' => 'valley-of-flowers-trek','title' => 'Valley of Flowers Trek — UNESCO World Heritage Trail 2026',      'region' => 'uttarakhand'],
        ['slug' => 'kedarnath-trek',        'title' => 'Kedarnath Trek — Char Dham Yatra Guide 2026',                    'region' => 'uttarakhand'],
        ['slug' => 'chopta-tungnath-trek',  'title' => "Chopta Tungnath Trek — World's Highest Shiva Temple 2026",       'region' => 'uttarakhand'],
        ['slug' => 'rishikesh-rafting',     'title' => 'Rishikesh Rafting — Grade 3-4 Ganga Rapids 2026',                'region' => 'uttarakhand'],
        // Kashmir
        ['slug' => 'kashmir-great-lakes-trek','title' => 'Kashmir Great Lakes Trek — 7-Day Alpine Circuit 2026',         'region' => 'kashmir'],
        ['slug' => 'gulmarg-tour',          'title' => 'Gulmarg Tour — Skiing & Cable Car Packages 2026',                'region' => 'kashmir'],
        ['slug' => 'pahalgam-tour',         'title' => 'Pahalgam Tour — Valley of Shepherds 2026',                      'region' => 'kashmir'],
        // Ladakh
        ['slug' => 'chadar-trek',           'title' => 'Chadar Trek — Frozen Zanskar River Walk 2026',                   'region' => 'ladakh'],
        ['slug' => 'leh-ladakh-tour',       'title' => 'Leh Ladakh Tour — Pangong Lake & Nubra Valley 2026',             'region' => 'ladakh'],
        ['slug' => 'markha-valley-trek',    'title' => 'Markha Valley Trek — 8-Day Ladakh Circuit 2026',                 'region' => 'ladakh'],
    ];
    foreach ($trips as $t) {
        $results['trips'][] = btg_create_post([
            'post_type'    => 'btg_trip',
            'post_title'   => $t['title'],
            'post_name'    => $t['slug'],
            'post_content' => '<p>Book ' . esc_html($t['title']) . ' with BTG certified local guides. Full itinerary, costs, logistics, and expert guidance.</p>',
            'meta'         => ['trip_slug' => $t['slug'], 'region' => $t['region']],
        ]);
    }

    // ── 5. NATIVE PAGES ───────────────────────────────────────────
    $pages = [
        ['slug' => 'about',            'title' => 'About Book The Guide',          'content' => "<p>Book The Guide (BTG) is India's first platform connecting travelers directly with certified, government-verified local guides. We believe the best travel experiences come from authentic connections with local experts who know the land, culture, and hidden gems of their region.</p>\n<h2>Our Mission</h2>\n<p>To make authentic, expert-guided travel accessible to every traveler while creating sustainable livelihoods for India's incredible pool of certified local guides.</p>"],
        ['slug' => 'contact',          'title' => 'Contact Us',                    'content' => "<p>We'd love to hear from you. Reach out to the Book The Guide team for any questions, partnership inquiries, or support.</p>\n<h2>Get In Touch</h2>\n<p>Email: <a href=\"mailto:hello@booktheguide.com\">hello@booktheguide.com</a></p>"],
        ['slug' => 'privacy-policy',   'title' => 'Privacy Policy',                'content' => "<p>This Privacy Policy describes how Book The Guide collects, uses, and shares information about you when you use our platform.</p>"],
        ['slug' => 'terms-of-service', 'title' => 'Terms of Service',              'content' => "<p>These Terms of Service govern your use of the Book The Guide platform. By using our services, you agree to these terms.</p>"],
        ['slug' => 'corporate-trips',  'title' => 'Corporate Trips & Team Outings', 'content' => "<p>Book The Guide offers custom corporate travel experiences — team outings, offsites, leadership retreats, and group adventures designed for corporate teams.</p>"],
    ];
    foreach ($pages as $p) {
        $results['pages'][] = btg_create_post([
            'post_type'    => 'page',
            'post_title'   => $p['title'],
            'post_name'    => $p['slug'],
            'post_content' => $p['content'],
        ]);
    }

    // ── 6. BLOG POSTS ─────────────────────────────────────────────
    // Create blog categories first
    $cat_ids = [];
    foreach (['Trekking', 'Himachal Pradesh', 'Uttarakhand', 'Kashmir', 'Ladakh', 'Adventure', 'Heritage', 'Culture'] as $cat_name) {
        $term = term_exists($cat_name, 'category');
        if (!$term) {
            $term = wp_insert_term($cat_name, 'category');
        }
        $cat_ids[$cat_name] = is_array($term) ? $term['term_id'] : $term;
    }

    $posts = [
        ['slug' => 'best-treks-himachal-pradesh',     'title' => '15 Best Treks in Himachal Pradesh for 2026',                    'cats' => ['Trekking', 'Himachal Pradesh']],
        ['slug' => 'kashmir-great-lakes-trek-guide',  'title' => 'Kashmir Great Lakes Trek: Complete Guide 2026',                  'cats' => ['Trekking', 'Kashmir']],
        ['slug' => 'leh-ladakh-road-trip-guide',      'title' => 'Leh Ladakh Road Trip: The Ultimate 2026 Guide',                  'cats' => ['Adventure', 'Ladakh']],
        ['slug' => 'top-heritage-walks-india',        'title' => '10 Best Heritage Walks in India with Certified Local Guides',    'cats' => ['Heritage', 'Culture']],
        ['slug' => 'beginner-trekking-guide-india',   'title' => 'Trekking in India for Beginners: Complete Guide 2026',           'cats' => ['Trekking']],
        ['slug' => 'best-treks-uttarakhand',          'title' => '12 Best Treks in Uttarakhand for 2026',                         'cats' => ['Trekking', 'Uttarakhand']],
    ];
    foreach ($posts as $p) {
        $cats = array_map(fn($c) => $cat_ids[$c] ?? 1, $p['cats']);
        $results['posts'][] = btg_create_post([
            'post_type'      => 'post',
            'post_title'     => $p['title'],
            'post_name'      => $p['slug'],
            'post_content'   => '<p>Read our expert guide on ' . esc_html($p['title']) . '. Certified BTG travel experts share insider tips, itineraries, and guide recommendations.</p>',
            'post_category'  => $cats,
        ]);
    }

    // ── Mark done ─────────────────────────────────────────────────
    update_option('btg_seeder_done', date('Y-m-d H:i:s'));

    $counts = [];
    foreach ($results as $type => $items) {
        $created_count = count(array_filter($items, fn($i) => $i['action'] === 'created'));
        $skipped_count = count(array_filter($items, fn($i) => $i['action'] === 'skipped'));
        $error_count   = count(array_filter($items, fn($i) => $i['action'] === 'error'));
        $counts[$type] = "created:{$created_count} skipped:{$skipped_count} errors:{$error_count}";
    }

    wp_send_json([
        'status'  => 'success',
        'message' => 'WordPress seeding complete! All pages created. You can now delete this mu-plugin.',
        'counts'  => $counts,
        'details' => $results,
    ]);
    exit;
});
