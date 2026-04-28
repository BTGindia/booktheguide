/**
 * WordPress Content Seeder for Book The Guide
 *
 * Creates ALL pages/CPTs in WordPress so Yoast SEO can manage them:
 *   - State Hub CPTs   (one per state → /explore/{state})
 *   - Category Landing CPTs (one per category → /experiences/{category})
 *   - State × Category CPTs (e.g. himachal-pradesh × trekking)
 *   - Trip CPTs         (one per SEO landing page → /{region}/{slug})
 *   - Native Pages      (About, Contact, Terms, Privacy)
 *   - Sample Blog Posts (travel articles)
 *
 * Usage: node seed-wordpress.js
 */

const https = require('https');

const WP_URL   = 'https://booktheguide-production.up.railway.app';
const WP_USER  = 'btg_admin';
const WP_PASS  = 'BTG@Admin2026!';
let   APP_PASS = '';    // filled after first-boot generation

// ─── HTTP helper ────────────────────────────────────────────
function request(method, path, body, auth) {
  return new Promise((resolve, reject) => {
    const authStr = APP_PASS
      ? Buffer.from(`${WP_USER}:${APP_PASS}`).toString('base64')
      : (auth || Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64'));

    const payload = body ? JSON.stringify(body) : null;
    const url = new URL(WP_URL + path);

    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + authStr,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Create or skip if slug exists ──────────────────────────
const created = { total: 0, skipped: 0, failed: 0 };

async function createPost(type, data) {
  const restBase = {
    post:             '/wp-json/wp/v2/posts',
    page:             '/wp-json/wp/v2/pages',
    state_hub:        '/wp-json/wp/v2/state_hub',
    category_landing: '/wp-json/wp/v2/category_landing',
    state_category:   '/wp-json/wp/v2/state_category',
    btg_trip:         '/wp-json/wp/v2/btg_trip',
  }[type];

  // Check if slug exists
  const check = await request('GET', `${restBase}?slug=${data.slug}&status=any`);
  if (check.status === 200 && Array.isArray(check.body) && check.body.length > 0) {
    console.log(`  ⏭  SKIP  [${type}] ${data.slug}`);
    created.skipped++;
    return check.body[0];
  }

  const res = await request('POST', restBase, { ...data, status: 'publish' });
  if (res.status === 201) {
    console.log(`  ✅ CREATE [${type}] ${data.slug}`);
    created.total++;
    return res.body;
  } else {
    console.error(`  ❌ FAIL  [${type}] ${data.slug} → ${res.status}:`, typeof res.body === 'string' ? res.body.slice(0, 200) : JSON.stringify(res.body).slice(0, 200));
    created.failed++;
    return null;
  }
}

// ─── Generate Application Password ──────────────────────────
async function generateAppPassword() {
  console.log('🔑 Generating Application Password...');
  const res = await request('POST', '/wp-json/wp/v2/users/me/application-passwords', { name: 'BTG-Seeder' });
  if (res.status === 201 && res.body?.password) {
    APP_PASS = res.body.password;
    console.log('✅ App Password generated\n');
    return true;
  }
  if (res.status === 200 && res.body?.password) {
    APP_PASS = res.body.password;
    console.log('✅ App Password generated\n');
    return true;
  }
  // If 409 (already exists), that's OK — regular pass might still work
  console.log(`ℹ️  App Password response: ${res.status} — using regular auth\n`);
  return false;
}

// ═══════════════════════════════════════════════════════════
//  STATE HUBS  — one per state
// ═══════════════════════════════════════════════════════════
const STATE_HUBS = [
  {
    slug: 'himachal-pradesh',
    name: 'Himachal Pradesh',
    tagline: 'Dev Bhoomi — Land of the Gods',
    description: 'From snow-capped Spiti peaks to lush Kullu valleys, Himachal Pradesh offers unparalleled trekking, paragliding, and mountain adventures. Home to iconic trails like Triund, Hampta Pass, and Sar Pass.',
    seo: 'Himachal Pradesh, often called Dev Bhoomi or "Land of the Gods," is one of India\'s most beloved mountain destinations. Book The Guide connects you with certified local guides who know every trail — from the apple orchards of Kullu to the high-altitude deserts of Spiti.',
    bestTime: 'March – June, September – November',
  },
  {
    slug: 'uttarakhand',
    name: 'Uttarakhand',
    tagline: 'Land of the Gods — Where the Himalayas Begin',
    description: 'Uttarakhand is the spiritual heartland and a trekker\'s paradise. From the Valley of Flowers to Kedarnath, from Rishikesh rafting to Jim Corbett safaris — adventure awaits at every altitude.',
    seo: 'Uttarakhand, the Land of the Gods, is where the Himalayas begin their grand ascent. Book The Guide offers certified local guides for every experience — from white-water rafting in Rishikesh to the challenging Roopkund trek, from the serene Valley of Flowers to Jim Corbett National Park.',
    bestTime: 'March – June, September – November',
  },
  {
    slug: 'kashmir',
    name: 'Jammu & Kashmir',
    tagline: 'Paradise on Earth',
    description: 'Kashmir is a land of unmatched natural beauty — Dal Lake shikaras, Mughal gardens, the Great Lakes trek, and Gulmarg\'s meadows. Discover this paradise with trusted local guides.',
    seo: 'Kashmir is a land of unmatched natural beauty. Our verified local guides know every hidden trail, ensuring safe passage through alpine meadows, frozen lakes, and centuries-old Sufi shrines.',
    bestTime: 'March – November',
  },
  {
    slug: 'ladakh',
    name: 'Ladakh',
    tagline: 'The Last Shangri-La — Roof of the World',
    description: 'Ladakh is a high-altitude desert of breathtaking beauty — crystal blue lakes, ancient monasteries, and some of India\'s most challenging treks. Experience Chadar, Markha Valley, and Khardung La.',
    seo: 'Ladakh is a high-altitude desert of breathtaking beauty. Our certified local guides ensure safe, authentic experiences across the Chadar Trek, Markha Valley, Nubra Valley, and the legendary Khardung La pass.',
    bestTime: 'June – September',
  },
  {
    slug: 'rajasthan',
    name: 'Rajasthan',
    tagline: 'Land of Kings — Where Heritage Comes Alive',
    description: 'Rajasthan is India\'s most colourful state — grand forts, regal palaces, vibrant bazaars, and golden deserts. Walk through centuries of Rajput history with expert heritage guides.',
    seo: 'Rajasthan, the Land of Kings, is India\'s most colourful state. From the pink walls of Jaipur to the blue lanes of Jodhpur, experience Rajasthan like a local with BTG verified guides.',
    bestTime: 'October – March',
  },
  {
    slug: 'delhi',
    name: 'Delhi',
    tagline: "Where India's Past Meets Its Future",
    description: 'Delhi is India\'s capital and a living museum of Mughal, British, and modern Indian heritage. From Chandni Chowk food walks to Mughal architecture trails.',
    seo: 'Delhi is India\'s capital and a living museum. Our expert city guides reveal layers of history across Old Delhi, Mughal monuments, and contemporary Lutyens Delhi.',
    bestTime: 'October – March',
  },
  {
    slug: 'uttar-pradesh',
    name: 'Uttar Pradesh',
    tagline: 'The Heartland of Indian Heritage',
    description: 'Uttar Pradesh is home to the Taj Mahal, Varanasi ghats, Lucknow\'s nawabi culture, and Vrindavan\'s spiritual trails.',
    seo: 'Uttar Pradesh is home to the Taj Mahal, Varanasi ghats, Lucknow\'s nawabi culture, and millennia of Indian civilisation. BTG certified guides bring every story to life.',
    bestTime: 'October – March',
  },
  {
    slug: 'goa',
    name: 'Goa',
    tagline: 'Sun, Sand & Soul',
    description: 'Goa is more than beaches — Portuguese heritage, spice plantations, wildlife sanctuaries, and hidden waterfalls with local guides who reveal the real Goa.',
    seo: 'Goa is more than beaches. BTG local guides take you beyond the tourist trail — through Portuguese colonial churches, spice plantations, and jungle waterfalls.',
    bestTime: 'November – February',
  },
  {
    slug: 'kerala',
    name: 'Kerala',
    tagline: "God's Own Country",
    description: "Kerala's backwaters, spice-scented hill stations, ancient temples, and wild elephant corridors — discover God's Own Country with certified local guides.",
    seo: "Kerala, God's Own Country, is a land of emerald backwaters, misty hill stations, and ancient spice trails. BTG certified local guides take you through Alleppey's canals, Munnar's tea estates, and Thekkady's wildlife.",
    bestTime: 'September – March',
  },
  {
    slug: 'karnataka',
    name: 'Karnataka',
    tagline: 'One State, Many Worlds',
    description: 'Karnataka spans from Hampi\'s Vijayanagara ruins to Coorg\'s coffee estates, Kodagu forests to Gokarna beaches. Explore with expert local guides.',
    seo: 'Karnataka is one of India\'s most diverse states. BTG verified guides reveal Hampi\'s extraordinary ruins, Coorg\'s misty highlands, and Gokarna\'s pristine coast.',
    bestTime: 'October – March',
  },
];

// ═══════════════════════════════════════════════════════════
//  CATEGORY LANDINGS  — one per experience category
// ═══════════════════════════════════════════════════════════
const CATEGORY_LANDINGS = [
  {
    slug: 'tourist-guides',
    name: 'Tourist Guides',
    tagline: 'Explore Every City Like a Local',
    description: 'Connect with expert local tourist guides for city tours, heritage walks, food tours, photography workshops, and cultural experiences across India.',
    seo: 'BTG certified tourist guides offer private city tours, day hikes, culinary tours, photography workshops, and pet-friendly tours. Every guide is verified, background-checked, and expert in their region.',
  },
  {
    slug: 'group-trips',
    name: 'Group Trips',
    tagline: 'Travel Together, Create Memories',
    description: 'Join fixed-departure group trips across India. Treks, rafting, paragliding, and mountain expeditions with small groups led by expert certified guides.',
    seo: 'BTG fixed-departure group trips bring together like-minded travellers for mountain treks, river rafting, paragliding, and wilderness adventures across Himachal Pradesh, Uttarakhand, Kashmir, and Ladakh.',
  },
  {
    slug: 'adventure-guides',
    name: 'Adventure Sports',
    tagline: 'Raft, Climb, Paraglide with Certified Experts',
    description: 'Experience India\'s best adventure sports — river rafting, rock climbing, paragliding, biking tours, and mountaineering workshops with certified adventure guides.',
    seo: 'BTG certified adventure guides lead river rafting trips in Rishikesh, rock climbing in Hampi, paragliding in Bir Billing, and mountaineering workshops in the Himalayas. All guides are government-certified safety experts.',
  },
  {
    slug: 'heritage-walks',
    name: 'Heritage Walks',
    tagline: 'Walk Through Living History',
    description: 'Explore India\'s UNESCO World Heritage Sites, ancient temples, Mughal monuments, and colonial architecture with expert heritage walk guides.',
    seo: 'BTG heritage walk guides reveal the stories behind India\'s greatest monuments — from Old Delhi\'s lanes to Hampi\'s ruins, Jaipur\'s Havelis to Varanasi\'s ghats. Every walk is a time-travel experience.',
  },
  {
    slug: 'travel-with-influencers',
    name: 'Travel with Influencers',
    tagline: 'Explore India with Your Favourite Creators',
    description: 'Join exclusive travel experiences hosted by India\'s top travel influencers and content creators. Small groups, insider access, unforgettable content.',
    seo: 'BTG\'s influencer-led trips combine authentic travel experiences with content creation opportunities. Join India\'s top travel creators for exclusive small-group adventures in the Himalayas and beyond.',
  },
  {
    slug: 'offbeat-travel',
    name: 'Offbeat Travel',
    tagline: 'Discover India\'s Hidden Gems',
    description: 'Leave the tourist trail behind. Explore secret valleys, remote villages, hidden waterfalls, and unexplored trails with local offbeat travel specialists.',
    seo: 'BTG offbeat travel specialists take you to Spiti\'s remote monasteries, Gurez Valley\'s hidden meadows, Chopta\'s forgotten trails, and Zanskar\'s isolated gorges — places that most tourists never find.',
  },
  {
    slug: 'trekking',
    name: 'Trekking',
    tagline: 'Conquer India\'s Greatest Trails',
    description: 'From beginner day hikes to multi-day Himalayan expeditions — book certified trekking guides for Triund, Hampta Pass, Chadar, Kedarnath, and hundreds of other trails across India.',
    seo: 'BTG certified trekking guides lead treks across the Himalayas — from easy day hikes like Triund to challenging multi-day routes like Chadar, Pin Parvati, and Roopkund. Every guide has mountaineering certification and local expertise.',
  },
];

// ═══════════════════════════════════════════════════════════
//  TRIPS (SEO Landing Pages) — {region}/{slug}
// ═══════════════════════════════════════════════════════════
const TRIPS = [
  // Himachal Pradesh
  { slug: 'triund-trek', title: 'Triund Trek Packages — Distance, Cost, Itinerary & Booking 2026', region: 'himachal-pradesh', destination: 'McLeod Ganj', description: 'Book the best Triund Trek packages with certified local guides. Complete details on distance (9 km from Dharamshala), cost, itinerary, camping & best time to visit.' },
  { slug: 'kheerganga-trek', title: 'Kheerganga Trek Packages — Hot Springs, Distance & Booking 2026', region: 'himachal-pradesh', destination: 'Parvati Valley', description: 'Book Kheerganga trek packages with certified Parvati Valley guides. Explore the famous hot springs trek from Kasol — distance, cost, route & itinerary.' },
  { slug: 'hampta-pass-trek', title: 'Hampta Pass Trek Packages — 4270m Himalayan Crossing 2026', region: 'himachal-pradesh', destination: 'Manali', description: 'Hampta Pass trek (4270m) — one of Himachal\'s most dramatic crossings. Book certified guide packages from Manali with complete itinerary, cost & logistics.' },
  { slug: 'sar-pass-trek', title: 'Sar Pass Trek Packages — Snow Trek near Kasol 2026', region: 'himachal-pradesh', destination: 'Kasol', description: 'Sar Pass trek packages with verified local guides. A 5-day snow trek from Kasol through pine forests and alpine meadows at 4250m elevation.' },
  { slug: 'spiti-valley-tour', title: 'Spiti Valley Tour Packages — Road Trip & Stays 2026', region: 'himachal-pradesh', destination: 'Spiti Valley', description: 'Spiti Valley tour packages — cold desert landscapes, ancient monasteries, and remote villages at 3800m. Certified local guides for complete Spiti experiences.' },
  { slug: 'dharamshala-tour', title: 'Dharamshala Tour Packages — McLeod Ganj & Tibetan Culture 2026', region: 'himachal-pradesh', destination: 'Dharamshala', description: 'Explore Dharamshala and McLeod Ganj with certified local guides. Tibetan culture, monastery visits, mountain hikes, and café culture in the Himalayas.' },
  // Uttarakhand
  { slug: 'valley-of-flowers-trek', title: 'Valley of Flowers Trek Packages — UNESCO World Heritage Trail 2026', region: 'uttarakhand', destination: 'Chamoli', description: 'Valley of Flowers trek — a UNESCO World Heritage Site blooming with 300+ alpine flower species. Book certified guide packages with complete logistics.' },
  { slug: 'kedarnath-trek', title: 'Kedarnath Trek Packages — Dham Yatra 2026', region: 'uttarakhand', destination: 'Rudraprayag', description: 'Kedarnath trek packages with certified local guides. Complete Char Dham Yatra guidance, helicopter options, and comfortable stay packages.' },
  { slug: 'chopta-tungnath-trek', title: 'Chopta Tungnath Trek — World\'s Highest Shiva Temple 2026', region: 'uttarakhand', destination: 'Chopta', description: 'Chopta to Tungnath (3680m) and Chandrashila (4090m) — Uttarakhand\'s most scenic and accessible high-altitude trek. Book certified local guide packages.' },
  { slug: 'rishikesh-rafting', title: 'Rishikesh Rafting Packages — Grade 3-4 Ganga Rapids 2026', region: 'uttarakhand', destination: 'Rishikesh', description: 'White-water rafting in Rishikesh on the Ganga with certified rafting guides. Grade 3-4 rapids, complete safety gear, and expert guidance for all skill levels.' },
  // Kashmir
  { slug: 'kashmir-great-lakes-trek', title: 'Kashmir Great Lakes Trek Packages — 7-Day Alpine Circuit 2026', region: 'kashmir', destination: 'Sonamarg', description: 'Kashmir Great Lakes trek — a stunning 7-day circuit through 7 pristine alpine lakes. Book certified Kashmir guide packages for the most beautiful trek in India.' },
  { slug: 'gulmarg-tour', title: 'Gulmarg Tour Packages — Skiing & Cable Car 2026', region: 'kashmir', destination: 'Gulmarg', description: 'Gulmarg tour packages — Asia\'s top skiing destination and India\'s highest gondola. Book certified local guide packages for skiing, snowboarding, and meadow treks.' },
  { slug: 'pahalgam-tour', title: 'Pahalgam Tour Packages — Valley of Shepherds 2026', region: 'kashmir', destination: 'Pahalgam', description: 'Pahalgam tour packages in the Valley of Shepherds. Explore Betaab Valley, Aru Valley, Chandanwari, and the Lidder River with certified local Kashmir guides.' },
  // Ladakh
  { slug: 'chadar-trek', title: 'Chadar Trek Packages — Frozen Zanskar River Walk 2026', region: 'ladakh', destination: 'Leh', description: 'Chadar Trek — walking on the frozen Zanskar River at -15°C to -30°C. One of India\'s most extreme and spectacular winter adventures. Book certified Ladakhi guide packages.' },
  { slug: 'leh-ladakh-tour', title: 'Leh Ladakh Tour Packages — Pangong Lake & Nubra Valley 2026', region: 'ladakh', destination: 'Leh', description: 'Complete Leh Ladakh tour packages with certified local guides. Pangong Lake, Nubra Valley, Khardung La, monasteries, and Zanskar day trips.' },
  { slug: 'markha-valley-trek', title: 'Markha Valley Trek Packages — 8-Day Ladakh Circuit 2026', region: 'ladakh', destination: 'Leh', description: 'Markha Valley trek — an 8-day classic Ladakh circuit through remote villages, mountain passes, and Buddhist monasteries with certified local guides.' },
];

// ═══════════════════════════════════════════════════════════
//  NATIVE PAGES  — About, Contact, Terms, Privacy
// ═══════════════════════════════════════════════════════════
const PAGES = [
  {
    slug: 'about',
    title: 'About Book The Guide',
    content: `<p>Book The Guide (BTG) is India's first platform connecting travelers directly with certified, government-verified local guides. We believe the best travel experiences come from authentic connections with local experts who know the land, culture, and hidden gems of their region.</p>
<h2>Our Mission</h2>
<p>To make authentic, expert-guided travel accessible to every traveler while creating sustainable livelihoods for India's incredible pool of certified local guides.</p>
<h2>Why BTG?</h2>
<ul><li>All guides are background-checked and government-certified</li><li>Direct booking — no middlemen, better prices</li><li>Verified reviews from real travelers</li><li>Instant booking with flexible cancellation</li><li>24/7 trip support</li></ul>`,
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    content: `<p>We'd love to hear from you. Reach out to the Book The Guide team for any questions, partnership inquiries, or support.</p>
<h2>Get In Touch</h2>
<p>Email: <a href="mailto:hello@booktheguide.com">hello@booktheguide.com</a></p>
<p>For guide partnership inquiries: <a href="mailto:guides@booktheguide.com">guides@booktheguide.com</a></p>
<h2>Response Time</h2>
<p>We typically respond within 24 hours on business days.</p>`,
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `<p>This Privacy Policy describes how Book The Guide ("BTG", "we", "us", or "our") collects, uses, and shares information about you when you use our platform at www.booktheguide.com.</p>
<h2>Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you create an account, make a booking, or contact us for support. This includes name, email address, phone number, and payment information.</p>
<h2>How We Use Your Information</h2>
<p>We use the information we collect to provide, maintain, and improve our services, process bookings and payments, communicate with you, and comply with legal obligations.</p>`,
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    content: `<p>These Terms of Service govern your use of the Book The Guide platform. By using our services, you agree to these terms.</p>
<h2>Use of Services</h2>
<p>Book The Guide provides a platform connecting travelers with certified local guides. All bookings are subject to the guide's cancellation policy.</p>
<h2>Booking & Payments</h2>
<p>All prices are in Indian Rupees (INR) unless otherwise stated. Payments are processed securely through our payment partners.</p>`,
  },
  {
    slug: 'corporate-trips',
    title: 'Corporate Trips & Team Outings',
    content: `<p>Book The Guide offers custom corporate travel experiences — team outings, offsites, leadership retreats, and group adventures designed for corporate teams.</p>
<h2>Why Choose BTG for Corporate Travel?</h2>
<ul><li>Certified expert guides for team-building experiences</li><li>Custom itineraries based on your group's interests and fitness levels</li><li>End-to-end logistics management</li><li>Dedicated corporate account manager</li><li>GST invoicing available</li></ul>
<h2>Popular Corporate Experiences</h2>
<p>Team treks in Himachal Pradesh, river rafting camps in Rishikesh, heritage walks in Delhi and Jaipur, wildlife safaris in Corbett and Kabini.</p>`,
  },
];

// ═══════════════════════════════════════════════════════════
//  BLOG POSTS  — seed template posts for each state
// ═══════════════════════════════════════════════════════════
const BLOG_POSTS = [
  {
    slug: 'best-treks-himachal-pradesh',
    title: '15 Best Treks in Himachal Pradesh for 2026',
    excerpt: 'From the easy Triund trail to the challenging Pin Parvati Pass — a comprehensive guide to the best trekking routes in Himachal Pradesh with difficulty ratings, best seasons, and certified guide recommendations.',
    content: `<p>Himachal Pradesh is a trekker's paradise. Whether you're a weekend warrior looking for a quick Triund escape from McLeod Ganj or an experienced mountaineer eyeing the 5319m Hampta Pass, Himachal has a trail for every level.</p>
<h2>1. Triund Trek (Easy) — The Classic McLeod Ganj Escape</h2>
<p>Distance: 9 km from Dharamshala | Duration: 1-2 days | Best Time: March–June, September–November</p>
<p>Triund is arguably India's most popular overnight trek, offering panoramic views of the Dhauladhar range from the 2842m summit. The trail passes through oak and rhododendron forests, with the iconic rock face of Ilaka Peak dominating the horizon.</p>
<h2>2. Kheerganga Trek (Easy-Moderate) — Parvati Valley Hot Springs</h2>
<p>Distance: 14 km from Barshaini | Duration: 2 days | Best Time: May–November</p>
<p>Kheerganga is famous for its natural hot water spring at 2960m elevation — the perfect reward after trekking through lush Parvati Valley forests. The trail from Barshaini passes through charming hamlets and dense pine forests.</p>
<h2>3. Hampta Pass Trek (Moderate) — The Great Himalayan Contrast</h2>
<p>Distance: 35 km | Duration: 5 days | Best Time: June–September</p>
<p>Hampta Pass is one of Himachal's most dramatic treks — crossing from the lush green Kullu Valley to the stark, lunar landscape of Lahaul in a single day. The 4270m pass offers breathtaking views of Deo Tibba and Indrasan peaks.</p>`,
    categories: ['Trekking', 'Himachal Pradesh'],
  },
  {
    slug: 'kashmir-great-lakes-trek-guide',
    title: 'Kashmir Great Lakes Trek: Complete Guide 2026',
    excerpt: 'Everything you need to know about the Kashmir Great Lakes trek — 7 pristine alpine lakes, permits, route, difficulty, and the best certified local guides.',
    content: `<p>The Kashmir Great Lakes trek is consistently rated one of the most beautiful treks in India. A 7-day circuit through some of the most dramatic alpine scenery in the entire Himalayan range — crystalline lakes, wildflower meadows, and glacier-capped peaks at every turn.</p>
<h2>Trek Overview</h2>
<p>Distance: 70 km | Duration: 7 days | Max Altitude: 4300m (Gadsar Pass) | Difficulty: Moderate-Difficult</p>
<h2>The Seven Lakes</h2>
<ol><li>Vishansar Lake — the first pristine alpine lake at 3710m</li><li>Kishansar Lake — twin brother to Vishansar at 3801m</li><li>Gadsar Lake — the remote jewel at 3657m</li><li>Satsar Lake Group — seven small lakes in a hidden valley</li><li>Gangabal Lake — the largest and most dramatic at 3576m</li></ol>
<h2>Best Time to Visit</h2>
<p>The Kashmir Great Lakes trek is accessible only in summer — July to mid-September. The trail is snow-covered for most of the year and opens after the snowmelt in late June.</p>`,
    categories: ['Trekking', 'Kashmir'],
  },
  {
    slug: 'leh-ladakh-road-trip-guide',
    title: 'Leh Ladakh Road Trip: The Ultimate 2026 Guide',
    excerpt: 'Planning a Leh Ladakh road trip? Complete guide covering route, permits, best time, acclimatization tips, and certified local guide recommendations for 2026.',
    content: `<p>A Leh Ladakh road trip is on every Indian traveler's bucket list — and for good reason. This high-altitude desert offers some of the most dramatic landscapes on Earth, from the turquoise shores of Pangong Lake to the sand dunes of Nubra Valley.</p>
<h2>Getting to Leh</h2>
<p>There are two famous road approaches to Leh: the Manali-Leh Highway (NH-3) — 479 km, usually open June to mid-October — and the Srinagar-Leh Highway (NH-1) — 434 km, open May to November.</p>
<h2>Acclimatization is Non-Negotiable</h2>
<p>Leh sits at 3524m above sea level. Altitude sickness is a real risk. Plan at least 2-3 days of rest in Leh before heading to higher passes like Khardung La (5359m) or Changla Pass (5360m).</p>
<h2>Essential Permits</h2>
<p>Foreign nationals require an Inner Line Permit (ILP) for restricted areas including Pangong, Nubra, and Hanle. Indian nationals require an Inner Line Permit for Nubra Valley, Pangong Lake, and Tso Moriri.</p>`,
    categories: ['Adventure', 'Ladakh'],
  },
  {
    slug: 'top-heritage-walks-india',
    title: '10 Best Heritage Walks in India with Certified Local Guides',
    excerpt: 'From Old Delhi\'s lanes to Hampi\'s ruins, Varanasi\'s ghats to Jaipur\'s bazaars — the definitive guide to India\'s best heritage walk experiences with local expert guides.',
    content: `<p>India is a living museum. Every city, every lane, every crumbling fort has stories spanning centuries. The best way to truly understand these places isn't with a guidebook — it's with a certified local heritage guide who grew up in the shadow of these monuments.</p>
<h2>1. Old Delhi Food & Heritage Walk</h2>
<p>Old Delhi is a sensory overload in the best possible way. A 3-4 hour heritage walk through Chandni Chowk, the spice market of Khari Baoli, Jama Masjid, and the narrow galis of Shahjahanabad reveals layers of Mughal history alongside the best street food in India.</p>
<h2>2. Varanasi Ghat Walk at Dawn</h2>
<p>Walking Varanasi's 84 ghats at sunrise is one of the most profound travel experiences in the world. A certified local guide explains the significance of each ghat, the rituals of the Ganga Aarti, and the thousands of years of Hindu tradition embodied in every stone step.</p>
<h2>3. Hampi Vijayanagara Heritage Trek</h2>
<p>Hampi's 26 sq km UNESCO World Heritage Site contains over 1600 monuments from the Vijayanagara Empire (14th-16th century). A half-day heritage walk with an expert archaeologist guide brings the ruins alive with stories of kings, merchants, and temple dancers.</p>`,
    categories: ['Heritage', 'Culture'],
  },
  {
    slug: 'beginner-trekking-guide-india',
    title: 'Trekking in India for Beginners: Complete Guide 2026',
    excerpt: 'New to trekking? This complete beginner\'s guide covers the easiest Himalayan treks, essential gear, fitness preparation, and why a certified guide makes all the difference.',
    content: `<p>Starting your trekking journey in India is one of the best decisions you can make. The Himalayas offer trails for every fitness level — from easy weekend walks to challenging multi-week expeditions. Here's everything you need to know as a first-time trekker.</p>
<h2>Best Beginner Treks in India</h2>
<h3>Triund, Himachal Pradesh</h3>
<p>The perfect first Himalayan trek. Just 9 km from Dharamshala, well-marked trail, comfortable camping, and jaw-dropping Dhauladhar views. Difficulty: Easy.</p>
<h3>Kedarkantha, Uttarakhand</h3>
<p>A stunning winter trek (December-April) through snow-covered forests to a 3810m summit. Multiple chai stops, comfortable campsites, and safe snow walking. Difficulty: Easy-Moderate.</p>
<h3>Nag Tibba, Uttarakhand</h3>
<p>The nearest Himalayan summit to Delhi — just 309 km away. A 2-day weekend trek to 3022m with great views of Bandarpoonch and Kedarnath ranges. Perfect first snow trek.</p>
<h2>Why Trek with a Certified Guide?</h2>
<p>First-time trekkers often underestimate the importance of a local guide. Beyond navigation, certified guides provide weather expertise, emergency first aid, local knowledge of water sources and campsites, and an authentic cultural experience you simply can't get alone.</p>`,
    categories: ['Trekking', 'Beginners'],
  },
];

// ═══════════════════════════════════════════════════════════
//  STATE × CATEGORY COMBOS (most important ones)
// ═══════════════════════════════════════════════════════════
const STATE_CATEGORIES = [
  { slug: 'himachal-pradesh-trekking', title: 'Trekking in Himachal Pradesh', stateSlug: 'himachal-pradesh', categorySlug: 'trekking', description: 'Explore the best trekking routes in Himachal Pradesh — from Triund to Hampta Pass to Pin Parvati — with certified local trek guides.' },
  { slug: 'himachal-pradesh-adventure-guides', title: 'Adventure Sports in Himachal Pradesh', stateSlug: 'himachal-pradesh', categorySlug: 'adventure-guides', description: 'Paragliding in Bir Billing, river rafting in Kullu, rock climbing in Hampta — book certified adventure sports guides in Himachal Pradesh.' },
  { slug: 'himachal-pradesh-tourist-guides', title: 'Tourist Guides in Himachal Pradesh', stateSlug: 'himachal-pradesh', categorySlug: 'tourist-guides', description: 'Explore Manali, Shimla, Dharamshala, and Spiti with certified local tourist guides from Himachal Pradesh.' },
  { slug: 'uttarakhand-trekking', title: 'Trekking in Uttarakhand', stateSlug: 'uttarakhand', categorySlug: 'trekking', description: 'Valley of Flowers, Kedarnath, Chopta Tungnath, Roopkund — book certified trek guides for Uttarakhand\'s iconic Himalayan trails.' },
  { slug: 'uttarakhand-adventure-guides', title: 'Adventure Sports in Uttarakhand', stateSlug: 'uttarakhand', categorySlug: 'adventure-guides', description: 'White-water rafting in Rishikesh, bungee jumping in Jumpin Heights, skiing in Auli — certified adventure sports guides in Uttarakhand.' },
  { slug: 'kashmir-trekking', title: 'Trekking in Kashmir', stateSlug: 'kashmir', categorySlug: 'trekking', description: 'Kashmir Great Lakes, Tarsar Marsar, Sonmarg Nichnai — book certified local trekking guides for Kashmir\'s stunning alpine trails.' },
  { slug: 'ladakh-trekking', title: 'Trekking in Ladakh', stateSlug: 'ladakh', categorySlug: 'trekking', description: 'Chadar Trek, Markha Valley, Stok Kangri, Nubra Valley — certified Ladakhi guide packages for high-altitude trekking adventures.' },
  { slug: 'rajasthan-heritage-walks', title: 'Heritage Walks in Rajasthan', stateSlug: 'rajasthan', categorySlug: 'heritage-walks', description: 'Jaipur heritage walks, Jodhpur Blue City tours, Udaipur lake walks, Jaisalmer desert city tours — expert heritage guides in Rajasthan.' },
  { slug: 'delhi-heritage-walks', title: 'Heritage Walks in Delhi', stateSlug: 'delhi', categorySlug: 'heritage-walks', description: 'Old Delhi food walks, Mughal architecture trails, Lutyens Delhi cycle tours — certified heritage walk guides in Delhi.' },
  { slug: 'kerala-tourist-guides', title: 'Tourist Guides in Kerala', stateSlug: 'kerala', categorySlug: 'tourist-guides', description: 'Backwater tours in Alleppey, tea estate walks in Munnar, wildlife safaris in Thekkady — certified local tourist guides in Kerala.' },
  { slug: 'goa-tourist-guides', title: 'Tourist Guides in Goa', stateSlug: 'goa', categorySlug: 'tourist-guides', description: 'Portuguese heritage walks, spice plantation tours, wildlife treks in Bhagwan Mahavir Sanctuary — certified local tourist guides in Goa.' },
];

// ─── MAIN ────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  BTG WordPress Content Seeder');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Generate Application Password
  await generateAppPassword();

  // Step 2: Test auth
  const me = await request('GET', '/wp-json/wp/v2/users/me');
  if (me.status !== 200) {
    console.error('❌ Authentication failed! Status:', me.status);
    console.error('   Response:', JSON.stringify(me.body).slice(0, 300));
    process.exit(1);
  }
  console.log(`✅ Authenticated as: ${me.body.name}\n`);

  // Step 3: Ensure blog categories exist
  console.log('── Creating Blog Categories ──────────────');
  const blogCategoryMap = {};
  for (const cat of ['Trekking', 'Himachal Pradesh', 'Uttarakhand', 'Kashmir', 'Ladakh', 'Rajasthan', 'Adventure', 'Heritage', 'Culture', 'Beginners']) {
    const slug = cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const check = await request('GET', `/wp-json/wp/v2/categories?slug=${slug}`);
    if (check.status === 200 && Array.isArray(check.body) && check.body.length > 0) {
      blogCategoryMap[cat] = check.body[0].id;
    } else {
      const res = await request('POST', '/wp-json/wp/v2/categories', { name: cat, slug });
      if (res.status === 201) {
        blogCategoryMap[cat] = res.body.id;
        console.log(`  ✅ Category: ${cat}`);
      }
    }
  }

  // Step 4: State Hubs
  console.log('\n── State Hubs ────────────────────────────');
  for (const state of STATE_HUBS) {
    await createPost('state_hub', {
      title: state.name,
      slug: state.slug,
      content: `<p>${state.description}</p>\n\n<h2>About ${state.name}</h2>\n<p>${state.seo}</p>`,
      excerpt: state.tagline,
      meta: {
        state_slug: state.slug,
        tagline: state.tagline,
        overview_content: state.seo,
        best_time_to_visit: state.bestTime,
      },
    });
  }

  // Step 5: Category Landings
  console.log('\n── Category Landings ─────────────────────');
  for (const cat of CATEGORY_LANDINGS) {
    await createPost('category_landing', {
      title: cat.name,
      slug: cat.slug,
      content: `<p>${cat.description}</p>\n\n<h2>Why Choose BTG for ${cat.name}?</h2>\n<p>${cat.seo}</p>`,
      excerpt: cat.tagline,
      meta: {
        category_slug: cat.slug,
        tagline: cat.tagline,
        hero_description: cat.description,
      },
    });
  }

  // Step 6: State × Category
  console.log('\n── State × Category Combos ───────────────');
  for (const sc of STATE_CATEGORIES) {
    await createPost('state_category', {
      title: sc.title,
      slug: sc.slug,
      content: `<p>${sc.description}</p>`,
      meta: {
        state_slug: sc.stateSlug,
        category_slug: sc.categorySlug,
      },
    });
  }

  // Step 7: Trips (SEO landing pages)
  console.log('\n── Trip Pages (SEO Landing Pages) ────────');
  for (const trip of TRIPS) {
    await createPost('btg_trip', {
      title: trip.title,
      slug: trip.slug,
      content: `<p>${trip.description}</p>`,
      excerpt: trip.description,
      meta: {
        trip_slug: trip.slug,
        hero_description: trip.description,
      },
    });
  }

  // Step 8: Native Pages
  console.log('\n── Native Pages ──────────────────────────');
  for (const page of PAGES) {
    await createPost('page', {
      title: page.title,
      slug: page.slug,
      content: page.content,
    });
  }

  // Step 9: Blog Posts
  console.log('\n── Blog Posts ────────────────────────────');
  for (const post of BLOG_POSTS) {
    const catIds = (post.categories || []).map(c => blogCategoryMap[c]).filter(Boolean);
    await createPost('post', {
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      categories: catIds,
    });
  }

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('  DONE');
  console.log(`  Created : ${created.total}`);
  console.log(`  Skipped : ${created.skipped} (already exist)`);
  console.log(`  Failed  : ${created.failed}`);
  console.log('═══════════════════════════════════════════');
  console.log('\n✅ Visit wp-admin to see all content:');
  console.log('   https://booktheguide-production.up.railway.app/wp-admin\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
