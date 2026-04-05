<?php
// Headless theme — no frontend rendering.
// All content is served via WPGraphQL to the Next.js frontend.
wp_redirect(defined('BTG_NEXT_URL') ? BTG_NEXT_URL : 'https://booktheguide.com', 301);
exit;
