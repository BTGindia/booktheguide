// ─────────────────────────────────────────────────────────────
//  SEO Landing Pages Configuration
// ─────────────────────────────────────────────────────────────
//
//  Each landing page targets a primary keyword and maps to a URL
//  like /{region}/{slug}. Content is managed from WordPress.
//
// ─────────────────────────────────────────────────────────────

export interface LandingPageData {
  /** URL slug — last segment of the path */
  slug: string;
  /** Region slug — first segment of the path (state abbreviation or name) */
  region: string;
  /** Full state name for DB queries */
  stateName: string;
  /** Destination / location name */
  destination: string;
  /** Category (e.g. Trek) */
  category: string;
  /** Primary target keyword */
  targetKeyword: string;
  /** Meta title for SEO */
  metaTitle: string;
  /** Secondary keywords for meta tags */
  secondaryKeywords: string[];
  /** Question keywords for FAQ schema */
  questionKeywords: string[];
  /** Default hero heading */
  defaultH1: string;
  /** Default meta description */
  defaultDescription: string;
  /** Difficulty level badge */
  difficulty: 'Easy' | 'Moderate' | 'Difficult' | 'Extreme';
  /** Best season to visit */
  bestSeason: string;
}

export const LANDING_PAGES: LandingPageData[] = [
  {
    slug: 'triund-trek',
    region: 'himachal-pradesh',
    stateName: 'Himachal Pradesh',
    destination: 'McLeod Ganj',
    category: 'Trek',
    targetKeyword: 'triund trek package',
    metaTitle: '7 Best Triund Trek Package Deals 2026',
    secondaryKeywords: [
      'triund trek', 'triund trek distance', 'triund trek height', 'triund trek night view',
      'triund trek camping', 'triund trek in december', 'triund trek base camp',
      'triund trek in winter', 'triund trek cost', 'triund trek from delhi',
      'triund trek route map', 'triund trek view', 'triund trek location',
      'triund trek itinerary', 'triund trek height in km',
      'triund trek distance from dharamshala',
    ],
    questionKeywords: [
      'Where is Triund Trek?', 'What is the distance of Triund Trek?',
      'What is the height of Triund Trek?', 'What is the cost of Triund Trek?',
      'How to reach Triund Trek from Delhi?', 'What is the route map of Triund Trek?',
      'What is the best time to visit Triund Trek?', 'Is Triund Trek safe in winter?',
      'Can we do Triund Trek in December?',
      'How long is Triund Trek distance from Dharamshala?',
    ],
    defaultH1: 'Triund Trek Packages',
    defaultDescription: 'Book the best Triund Trek packages with certified local guides. Get complete details on distance, cost, itinerary, camping & best time to visit. Verified guides, instant booking.',
    difficulty: 'Easy',
    bestSeason: 'March – June, September – November',
  },
  {
    slug: 'kheerganga',
    region: 'himachal-pradesh',
    stateName: 'Himachal Pradesh',
    destination: 'Parvati Valley, Kullu',
    category: 'Trek',
    targetKeyword: 'kheerganga trek package',
    metaTitle: 'Kheerganga Trek Package - Distance, Cost, Itinerary & Booking 2026',
    secondaryKeywords: [
      'kheerganga trek', 'kheerganga trek distance', 'kheerganga trek from kasol',
      'kheerganga trek best time', 'kheerganga trek cost', 'kheerganga trek itinerary',
      'kheerganga trek route', 'kheerganga trek weather', 'kheerganga trek booking',
      'kheerganga trek package from delhi',
    ],
    questionKeywords: [
      'Where is Kheerganga Trek?', 'What is the distance of Kheerganga Trek?',
      'What is the best time for Kheerganga Trek?',
      'How to reach Kheerganga Trek from Kasol?', 'How to reach Kheerganga Trek from Delhi?',
      'Is Kheerganga Trek safe in winter?', 'Can we do Kheerganga Trek in winter?',
      'What is the cost of Kheerganga Trek package?',
      'How long is Kheerganga Trek distance from Kasol?',
    ],
    defaultH1: 'Kheerganga Trek Packages',
    defaultDescription: 'Book Kheerganga Trek packages with certified local guides from Kasol. Complete distance, cost, itinerary & booking details. Hot springs camping included.',
    difficulty: 'Moderate',
    bestSeason: 'March – June, September – November',
  },
  {
    slug: 'hampta-pass',
    region: 'himachal-pradesh',
    stateName: 'Himachal Pradesh',
    destination: 'Kullu Valley',
    category: 'Trek',
    targetKeyword: 'hampta pass trek package',
    metaTitle: '5 Best Hampta Pass Trek Packages 2026 - Full Guide & Cost',
    secondaryKeywords: [
      'hampta pass trek', 'hampta pass trek distance', 'hampta pass trek package',
      'hampta pass trek best time', 'hampta pass trek price', 'best time for hampta pass trek',
      'hampta pass trek height', 'hampta pass trek route', 'hampta pass trek weather',
      'hampta pass trek booking', 'hampta pass trek difficulty level',
      'hampta pass trek itinerary',
    ],
    questionKeywords: [
      'Where is Hampta Pass?', 'What is the distance of Hampta Pass Trek?',
      'What is the best time to visit Hampta Pass Trek?',
      'How to reach Hampta Pass Trek from Manali?',
      'Is Hampta Pass Trek difficult for beginners?',
      'What is the altitude of Hampta Pass Trek?',
      'Does Hampta Pass Trek include Chandratal Lake?',
      'What is the weather like in Hampta Pass Trek?',
      'How many days are required for Hampta Pass Trek?',
    ],
    defaultH1: 'Hampta Pass Trek Packages',
    defaultDescription: 'Book Hampta Pass Trek packages with certified local guides. Complete guide with cost, itinerary, altitude, difficulty & Chandratal Lake extension.',
    difficulty: 'Moderate',
    bestSeason: 'June – October',
  },
  {
    slug: 'bhrigu-lake',
    region: 'himachal-pradesh',
    stateName: 'Himachal Pradesh',
    destination: 'Bhrigu Lake',
    category: 'Trek',
    targetKeyword: 'bhrigu lake package',
    metaTitle: 'Bhrigu Lake Package – Complete Trek Guide 2026 | Altitude, Route & Best Time',
    secondaryKeywords: [
      'bhrigu lake', 'bhrigu lake location', 'bhrigu lake distance',
      'bhrigu lake trek distance', 'bhrigu lake best time to visit',
      'bhrigu lake weather', 'bhrigu lake altitude', 'bhrigu lake itinerary',
      'bhrigu lake route', 'how to reach bhrigu lake',
    ],
    questionKeywords: [
      'Where is Bhrigu Lake located?', 'What is the distance of Bhrigu Lake Trek?',
      'What is the best time to visit Bhrigu Lake?',
      'How to reach Bhrigu Lake from Manali?', 'What is the altitude of Bhrigu Lake?',
      'Is Bhrigu Lake Trek difficult?', 'How many days are required for Bhrigu Lake Trek?',
      'What is the weather like at Bhrigu Lake?',
      'Is Bhrigu Lake Trek suitable for beginners?',
    ],
    defaultH1: 'Bhrigu Lake Trek Packages',
    defaultDescription: 'Book Bhrigu Lake Trek packages with certified local guides from Manali. Complete guide with altitude, route, itinerary & best time to visit.',
    difficulty: 'Moderate',
    bestSeason: 'May – October',
  },
  {
    slug: 'sar-pass',
    region: 'himachal-pradesh',
    stateName: 'Himachal Pradesh',
    destination: 'Sar Pass',
    category: 'Trek',
    targetKeyword: 'sar pass trek booking',
    metaTitle: '5-Day Sar Pass Trek Booking 2026 - Complete Cost, Itinerary & Guide',
    secondaryKeywords: [
      'sar pass trek kasol', 'sar pass trek distance', 'sar pass trek height',
      'sar pass trek best time', 'sar pass trek package', 'kasol sar pass trek',
      'sar pass trek route map', 'sar pass trek altitude', 'sar pass trek cost',
      'sar pass trek itinerary', 'best time for sar pass trek',
    ],
    questionKeywords: [
      'Where is Sar Pass Trek located?', 'What is the distance of Sar Pass Trek?',
      'What is the best time to visit Sar Pass Trek?',
      'How to reach Sar Pass Trek from Kasol?',
      'Is Sar Pass Trek difficult for beginners?',
      'What is the altitude of Sar Pass Trek?',
      'What is the starting point of Sar Pass Trek?',
      'How many days are required for Sar Pass Trek?',
      'What is the weather like during Sar Pass Trek?',
    ],
    defaultH1: 'Sar Pass Trek Packages',
    defaultDescription: 'Book Sar Pass Trek packages from Kasol with certified local guides. 5-day itinerary with complete cost, route map & booking details.',
    difficulty: 'Moderate',
    bestSeason: 'April – June, September – November',
  },
  {
    slug: 'beas-kund',
    region: 'himachal-pradesh',
    stateName: 'Himachal Pradesh',
    destination: 'Beas Kund',
    category: 'Trek',
    targetKeyword: 'beas kund trek package',
    metaTitle: '5-Day Beas Kund Trek Package 2026 - Complete Guide: Cost, Itinerary, Altitude & Tips',
    secondaryKeywords: [
      'beas kund trek distance', 'beas kund trek map', 'beas kund trek base camp',
      'beas kund trek best time to visit', 'beas kund height', 'beas kund trek package',
      'beas kund trek height', 'beas kund trek altitude', 'beas kund trek itinerary',
      'beas kund trek best time', 'beas kund trek cost', 'beas kund trek difficulty level',
      'beas kund trek distance from manali', 'beas kund trek starting point',
    ],
    questionKeywords: [
      'Where is Beas Kund Trek located?', 'What is the distance of Beas Kund Trek?',
      'What is the best time to visit Beas Kund Trek?',
      'How to reach Beas Kund Trek from Manali?',
      'Is Beas Kund Trek difficult for beginners?',
      'What is the altitude of Beas Kund Trek?',
      'What is the starting point of Beas Kund Trek?',
      'How many days are required for Beas Kund Trek?',
      'What is the weather like during Beas Kund Trek?',
    ],
    defaultH1: 'Beas Kund Trek Packages',
    defaultDescription: 'Book Beas Kund Trek packages with certified local guides from Manali. Complete 5-day guide with cost, altitude, itinerary & expert tips.',
    difficulty: 'Easy',
    bestSeason: 'May – October',
  },
  {
    slug: 'kareri-lake',
    region: 'himachal-pradesh',
    stateName: 'Himachal Pradesh',
    destination: 'Kareri Lake',
    category: 'Trek',
    targetKeyword: 'kareri lake trek',
    metaTitle: 'Kareri Lake Trek Guide 2026 - Complete Cost, Itinerary, Route & Expert Tips',
    secondaryKeywords: [
      'kareri lake trek distance', 'kareri lake trek best time', 'kareri lake trek height',
      'kareri lake trek itinerary', 'kareri lake trek map', 'kareri lake trek route',
      'kareri lake trek difficulty', 'kareri lake trek weather', 'how to reach kareri lake',
      'kareri lake location',
    ],
    questionKeywords: [
      'Where is Kareri Lake?', 'How to reach Kareri Lake Trek?',
      'What is Kareri Lake Trek distance?', 'Is Kareri Lake Trek difficult?',
      'What is the best time to visit Kareri Lake?',
    ],
    defaultH1: 'Kareri Lake Trek Packages',
    defaultDescription: 'Book Kareri Lake Trek packages with certified local guides. Complete guide with cost, itinerary, route, difficulty & best time to visit.',
    difficulty: 'Moderate',
    bestSeason: 'March – June, September – November',
  },
  {
    slug: 'pin-parvati-trek',
    region: 'himachal-pradesh',
    stateName: 'Himachal Pradesh',
    destination: 'Parvati Valley',
    category: 'Trek',
    targetKeyword: 'pin parvati trek',
    metaTitle: 'Pin Parvati Trek 2026: Ultimate Guide, Cost & Itinerary',
    secondaryKeywords: [
      'pin parvati trek distance', 'pin parvati trek cost', 'pin parvati trek map',
      'pin parvati trek best time', 'pin parvati trek height', 'pin parvati trek difficulty',
      'pin parvati trek route', 'pin parvati trek package', 'pin parvati trek itinerary',
      'pin parvati trek altitude', 'best time for pin parvati trek',
      'pin parvati trek route map', 'pin parvati trek guide', 'pin parvati trek budget',
    ],
    questionKeywords: [
      'What is the best time for Pin Parvati Trek?',
      'How difficult is the Pin Parvati Trek?',
      'What is the total cost of Pin Parvati Trek?',
      'What is the distance of Pin Parvati Trek?',
      'What is the itinerary of Pin Parvati Trek?',
      'How many days are required for Pin Parvati Trek?',
      'What is the route of Pin Parvati Trek?',
      'What is the highest altitude of Pin Parvati Trek?',
      'Is Pin Parvati Trek suitable for beginners?',
      'Do I need a guide for Pin Parvati Trek?',
    ],
    defaultH1: 'Pin Parvati Trek Packages',
    defaultDescription: 'Book Pin Parvati Trek packages with certified local guides. Ultimate guide with cost, itinerary, route map, altitude & expert tips for 2026.',
    difficulty: 'Difficult',
    bestSeason: 'July – September',
  },
  {
    slug: 'kedarkantha',
    region: 'uk',
    stateName: 'Uttarakhand',
    destination: 'Kedarkantha',
    category: 'Trek',
    targetKeyword: 'kedarkantha trek package',
    metaTitle: 'Kedarkantha Trek Package 2026 - Complete Guide to Cost, Itinerary, Best Time & Expert Tips',
    secondaryKeywords: [
      'kedarkantha trek', 'kedarkantha trek distance', 'kedarkantha trek best time',
      'kedarkantha trek height', 'kedarkantha trek itinerary', 'kedarkantha trek route',
      'kedarkantha trek cost', 'kedarkantha trek temperature',
      'kedarkantha trek difficulty level', 'kedarkantha trek altitude',
    ],
    questionKeywords: [
      'Where is Kedarkantha Trek?', 'What is the best time for Kedarkantha Trek?',
      'How difficult is Kedarkantha Trek?', 'What is Kedarkantha Trek height?',
      'How to reach Kedarkantha Trek?',
    ],
    defaultH1: 'Kedarkantha Trek Packages',
    defaultDescription: 'Book Kedarkantha Trek packages with certified local guides. Complete guide with cost, itinerary, best time, altitude & expert tips. Winter snow trek.',
    difficulty: 'Easy',
    bestSeason: 'December – April',
  },
  {
    slug: 'valley-of-flowers',
    region: 'uk',
    stateName: 'Uttarakhand',
    destination: 'Valley of Flowers',
    category: 'Trek',
    targetKeyword: 'valley of flowers trek',
    metaTitle: 'Valley of Flowers Trek Package 2026: Cost, Itinerary & Guide',
    secondaryKeywords: [
      'valley of flowers trek distance', 'valley of flowers trek best time',
      'valley of flowers trek itinerary', 'valley of flowers trek route',
      'valley of flowers trek cost', 'valley of flowers trek map',
      'valley of flowers trek difficulty', 'valley of flowers trek duration',
      'valley of flowers trek altitude', 'valley of flowers trek starting point',
    ],
    questionKeywords: [
      'Where is Valley of Flowers Trek?',
      'What is the best time to visit Valley of Flowers?',
      'How long is Valley of Flowers Trek?', 'Is Valley of Flowers Trek difficult?',
      'How to reach Valley of Flowers Trek?',
    ],
    defaultH1: 'Valley of Flowers Trek Packages',
    defaultDescription: 'Book Valley of Flowers Trek packages with certified local guides. UNESCO World Heritage site with complete cost, itinerary & guide for 2026.',
    difficulty: 'Moderate',
    bestSeason: 'July – September',
  },
  {
    slug: 'har-ki-dun',
    region: 'uk',
    stateName: 'Uttarakhand',
    destination: 'Har Ki Dun',
    category: 'Trek',
    targetKeyword: 'har ki dun trek',
    metaTitle: 'Har Ki Dun Trek Guide 2026: Cost, Itinerary, Altitude & Expert Tips',
    secondaryKeywords: [
      'har ki dun trek distance', 'har ki dun trek best time', 'har ki dun trek itinerary',
      'har ki dun trek route', 'har ki dun trek cost', 'har ki dun trek map',
      'har ki dun trek altitude', 'har ki dun trek height', 'har ki dun trek weather',
      'har ki dun trek difficulty level',
    ],
    questionKeywords: [
      'Where is Har Ki Dun Trek?', 'What is the best time for Har Ki Dun Trek?',
      'How difficult is Har Ki Dun Trek?', 'How to reach Har Ki Dun Trek?',
      'What is Har Ki Dun Trek distance?',
    ],
    defaultH1: 'Har Ki Dun Trek Packages',
    defaultDescription: 'Book Har Ki Dun Trek packages with certified local guides. Complete guide with cost, itinerary, altitude & expert tips for the ancient cradle valley.',
    difficulty: 'Moderate',
    bestSeason: 'April – June, September – November',
  },
  {
    slug: 'nag-tibba',
    region: 'uk',
    stateName: 'Uttarakhand',
    destination: 'Nag Tibba',
    category: 'Trek',
    targetKeyword: 'nag tibba trek package',
    metaTitle: 'Nag Tibba Trek – Complete Guide, Distance, Cost, Itinerary & Best Time',
    secondaryKeywords: [
      'nag tibba trek', 'nag tibba trek distance', 'nag tibba trek best time',
      'nag tibba trek height', 'nag tibba trek itinerary', 'nag tibba trek route',
      'nag tibba trek cost', 'nag tibba trek weather', 'nag tibba trek altitude',
      'nag tibba trek from dehradun',
    ],
    questionKeywords: [
      'Where is Nag Tibba Trek?', 'What is the best time for Nag Tibba Trek?',
      'How difficult is Nag Tibba Trek?', 'How to reach Nag Tibba Trek?',
      'What is Nag Tibba Trek distance?',
    ],
    defaultH1: 'Nag Tibba Trek Packages',
    defaultDescription: 'Book Nag Tibba Trek packages with certified local guides. Weekend trek from Dehradun with complete distance, cost, itinerary & best time.',
    difficulty: 'Easy',
    bestSeason: 'Year-round (best: March – June, October – December)',
  },
  {
    slug: 'brahmatal',
    region: 'uk',
    stateName: 'Uttarakhand',
    destination: 'Brahmatal',
    category: 'Trek',
    targetKeyword: 'brahmatal trek package',
    metaTitle: 'Brahmatal Trek – Complete Guide, Itinerary, Cost, Best Time & Difficulty',
    secondaryKeywords: [
      'brahmatal trek', 'brahmatal trek distance', 'brahmatal trek best time',
      'brahmatal trek height', 'brahmatal trek itinerary', 'brahmatal trek route map',
      'brahmatal trek cost', 'brahmatal trek weather', 'brahmatal trek altitude',
      'brahmatal trek difficulty level',
    ],
    questionKeywords: [
      'Where is Brahmatal Trek?', 'What is the best time for Brahmatal Trek?',
      'How difficult is Brahmatal Trek?', 'How to reach Brahmatal Trek?',
      'What is Brahmatal Trek distance?',
    ],
    defaultH1: 'Brahmatal Trek Packages',
    defaultDescription: 'Book Brahmatal Trek packages with certified local guides. Complete winter trek guide with itinerary, cost, difficulty & best time to visit.',
    difficulty: 'Moderate',
    bestSeason: 'December – March',
  },
  {
    slug: 'dayara-bugyal',
    region: 'uk',
    stateName: 'Uttarakhand',
    destination: 'Dayara Bugyal',
    category: 'Trek',
    targetKeyword: 'dayara bugyal trek',
    metaTitle: 'Dayara Bugyal Trek – Complete Guide, Distance, Itinerary, Cost & Best Time',
    secondaryKeywords: [
      'dayara bugyal trek distance', 'dayara bugyal trek best time',
      'dayara bugyal trek height', 'dayara bugyal trek itinerary',
      'dayara bugyal trek route', 'dayara bugyal trek cost', 'dayara bugyal trek weather',
      'dayara bugyal trek altitude', 'dayara bugyal trek location',
      'dayara bugyal trek difficulty level',
    ],
    questionKeywords: [
      'Where is Dayara Bugyal Trek?', 'What is the best time for Dayara Bugyal Trek?',
      'How difficult is Dayara Bugyal Trek?', 'How to reach Dayara Bugyal?',
      'What is Dayara Bugyal Trek distance?',
    ],
    defaultH1: 'Dayara Bugyal Trek Packages',
    defaultDescription: 'Book Dayara Bugyal Trek packages with certified local guides. Complete guide with distance, itinerary, cost & best time to visit the alpine meadows.',
    difficulty: 'Easy',
    bestSeason: 'May – July, November – February',
  },
  {
    slug: 'markha-valley',
    region: 'ladakh',
    stateName: 'Ladakh',
    destination: 'Markha Valley',
    category: 'Trek',
    targetKeyword: 'markha valley trek cost',
    metaTitle: 'Markha Valley Trek – Complete Guide, Itinerary, Cost, Distance & Best Time',
    secondaryKeywords: [
      'markha valley trek', 'markha valley trek altitude', 'markha valley trek best time',
      'markha valley trek itinerary', 'markha valley trek route',
      'markha valley trek distance', 'markha valley trek difficulty',
      'markha valley trek map', 'markha valley trek height', 'ladakh markha valley trek',
    ],
    questionKeywords: [
      'Where is Markha Valley Trek?', 'What is the best time for Markha Valley Trek?',
      'How difficult is Markha Valley Trek?', 'What is Markha Valley Trek altitude?',
      'How long is Markha Valley Trek?',
    ],
    defaultH1: 'Markha Valley Trek Packages',
    defaultDescription: 'Book Markha Valley Trek packages with certified local guides in Ladakh. Complete guide with itinerary, cost, distance & best time.',
    difficulty: 'Difficult',
    bestSeason: 'June – September',
  },
  {
    slug: 'stok-kangri',
    region: 'ladakh',
    stateName: 'Ladakh',
    destination: 'Stok Kangri',
    category: 'Trek',
    targetKeyword: 'stok kangri trek',
    metaTitle: 'Stok Kangri Trek – Best Packages, Cost, Itinerary & Best Time',
    secondaryKeywords: [
      'stok kangri trek', 'stok kangri trek height', 'stok kangri trek best time',
      'stok kangri trek itinerary', 'stok kangri trek route', 'stok kangri trek cost',
      'stok kangri trek distance', 'stok kangri trek altitude', 'stok kangri trek difficulty',
      'stok kangri trek ladakh',
    ],
    questionKeywords: [
      'Where is Stok Kangri Trek?', 'What is the best time for Stok Kangri Trek?',
      'How difficult is Stok Kangri Trek?', 'What is Stok Kangri height?',
      'How to reach Stok Kangri Trek?',
    ],
    defaultH1: 'Stok Kangri Trek Packages',
    defaultDescription: 'Book Stok Kangri Trek packages with certified local guides in Ladakh. India\'s highest trekkable peak with cost, itinerary & best time guide.',
    difficulty: 'Extreme',
    bestSeason: 'July – September',
  },
  {
    slug: 'kashmir-great-lakes',
    region: 'kashmir',
    stateName: 'Jammu & Kashmir',
    destination: 'Kashmir Great Lakes',
    category: 'Trek',
    targetKeyword: 'kashmir great lakes trek package',
    metaTitle: 'Kashmir Great Lakes Trek – Complete Guide, Itinerary, Cost & Best Time',
    secondaryKeywords: [
      'kashmir great lakes trek', 'kashmir great lakes trek distance',
      'kashmir great lakes trek best time', 'kashmir great lakes trek itinerary',
      'kashmir great lakes trek route map', 'kashmir great lakes trek cost',
      'kashmir great lakes trek altitude', 'kashmir great lakes trek difficulty',
      'great lakes trek kashmir', 'kashmir great lakes trek reviews',
    ],
    questionKeywords: [
      'Where is Kashmir Great Lakes Trek?',
      'What is the best time for Kashmir Great Lakes Trek?',
      'How difficult is Kashmir Great Lakes Trek?',
      'How long is Kashmir Great Lakes Trek?',
      'How to reach Kashmir Great Lakes Trek?',
    ],
    defaultH1: 'Kashmir Great Lakes Trek Packages',
    defaultDescription: 'Book Kashmir Great Lakes Trek packages with certified local guides. Complete guide with itinerary, cost, best time & difficulty for 7 alpine lakes.',
    difficulty: 'Difficult',
    bestSeason: 'July – September',
  },
  {
    slug: 'tarsar-marsar',
    region: 'kashmir',
    stateName: 'Jammu & Kashmir',
    destination: 'Tarsar Marsar',
    category: 'Trek',
    targetKeyword: 'tarsar marsar trek',
    metaTitle: '7-Day Tarsar Marsar Trek 2026 - Ultimate Kashmir Guide',
    secondaryKeywords: [
      'tarsar marsar trek distance', 'tarsar marsar trek best time',
      'tarsar marsar trek itinerary', 'tarsar marsar trek route',
      'tarsar marsar trek cost', 'tarsar marsar trek height',
      'tarsar marsar trek location', 'tarsar marsar trek altitude',
      'tarsar marsar trek difficulty', 'kashmir tarsar marsar trek',
    ],
    questionKeywords: [
      'Where is Tarsar Marsar Trek?', 'What is the best time for Tarsar Marsar Trek?',
      'How difficult is Tarsar Marsar Trek?', 'How to reach Tarsar Marsar Trek?',
      'What is Tarsar Marsar Trek distance?',
    ],
    defaultH1: 'Tarsar Marsar Trek Packages',
    defaultDescription: 'Book Tarsar Marsar Trek packages with certified local guides in Kashmir. 7-day ultimate guide with itinerary, cost & best time to visit twin alpine lakes.',
    difficulty: 'Difficult',
    bestSeason: 'July – September',
  },
];

/** All region slugs that have landing pages */
export const LANDING_REGIONS = Array.from(new Set(LANDING_PAGES.map((lp) => lp.region)));

/** Lookup a landing page by region + slug */
export function getLandingPage(region: string, slug: string): LandingPageData | undefined {
  return LANDING_PAGES.find((lp) => lp.region === region && lp.slug === slug);
}

/** Get all landing pages for a region */
export function getLandingPagesByRegion(region: string): LandingPageData[] {
  return LANDING_PAGES.filter((lp) => lp.region === region);
}

/** Get all slugs for generateStaticParams */
export function getAllLandingParams(): { region: string; slug: string }[] {
  return LANDING_PAGES.map((lp) => ({ region: lp.region, slug: lp.slug }));
}
