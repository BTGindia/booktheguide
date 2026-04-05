// ================================================================
// Indian States Data — centralized state info for all /explore pages
// ================================================================

export interface StateInfo {
  slug: string;
  name: string;
  code: string;
  tagline: string;
  description: string;
  heroImage: string;
  highlights: string[];
  bestTimeToVisit: string;
  popularCities: string[];
  isNorthIndia: boolean;
  /** Whether the state currently has active guides/products on BTG */
  isPrimary: boolean;
}

/**
 * Complete mapping of state slugs → state metadata.
 * Primary states (isPrimary:true) are those BTG focuses on initially.
 */
export const STATES: Record<string, StateInfo> = {
  'himachal-pradesh': {
    slug: 'himachal-pradesh',
    name: 'Himachal Pradesh',
    code: 'HP',
    tagline: 'Dev Bhoomi — Land of the Gods',
    description:
      'From the snow-capped peaks of Spiti to the lush valleys of Kullu, Himachal Pradesh offers unparalleled trekking, paragliding, and mountain adventures. Home to iconic trails like Triund, Hampta Pass, and Sar Pass.',
    heroImage: '/images/btg/optimized/frame-5.webp',
    highlights: ['Triund Trek', 'Spiti Valley', 'Manali', 'Kasol', 'Paragliding in Bir Billing'],
    bestTimeToVisit: 'March – June, September – November',
    popularCities: ['Manali', 'Shimla', 'Dharamshala', 'Kasol', 'Spiti'],
    isNorthIndia: true,
    isPrimary: true,
  },
  'uttarakhand': {
    slug: 'uttarakhand',
    name: 'Uttarakhand',
    code: 'UK',
    tagline: 'Land of the Gods — Where the Himalayas Begin',
    description:
      'Uttarakhand is the spiritual heartland of India and a trekker\'s paradise. From the Valley of Flowers to Kedarnath, from Rishikesh rafting to Jim Corbett safaris — adventure awaits at every altitude.',
    heroImage: '/images/btg/optimized/frame-7.webp',
    highlights: ['Valley of Flowers', 'Kedarnath Trek', 'Rishikesh Rafting', 'Chopta Tungnath', 'Jim Corbett'],
    bestTimeToVisit: 'March – June, September – November',
    popularCities: ['Rishikesh', 'Mussoorie', 'Nainital', 'Haridwar', 'Auli'],
    isNorthIndia: true,
    isPrimary: true,
  },
  'rajasthan': {
    slug: 'rajasthan',
    name: 'Rajasthan',
    code: 'RJ',
    tagline: 'Land of Kings — Where Heritage Comes Alive',
    description:
      'Rajasthan is India\'s most colourful state — a land of grand forts, regal palaces, vibrant bazaars, and golden deserts. Walk through centuries of Rajput history with expert heritage guides in Jaipur, Jodhpur, Udaipur, and Jaisalmer.',
    heroImage: '/images/btg/optimized/frame-8.webp',
    highlights: ['Jaipur Heritage Walk', 'Jodhpur Blue City Tour', 'Udaipur Lake Tour', 'Jaisalmer Desert Safari', 'Pushkar Cultural Walk'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer', 'Pushkar'],
    isNorthIndia: true,
    isPrimary: true,
  },
  'ladakh': {
    slug: 'ladakh',
    name: 'Ladakh',
    code: 'LA',
    tagline: 'The Last Shangri-La — Roof of the World',
    description:
      'Ladakh is a high-altitude desert of breathtaking beauty — crystal blue lakes, ancient monasteries, and some of India\'s most challenging treks. Experience Chadar, Markha Valley, and the Khardung La with expert local guides.',
    heroImage: '/images/btg/optimized/frame-7.webp',
    highlights: ['Chadar Trek', 'Pangong Lake', 'Nubra Valley', 'Markha Valley Trek', 'Monastery Trail'],
    bestTimeToVisit: 'June – September',
    popularCities: ['Leh', 'Nubra', 'Pangong', 'Zanskar', 'Kargil'],
    isNorthIndia: true,
    isPrimary: true,
  },
  'kashmir': {
    slug: 'kashmir',
    name: 'Jammu & Kashmir',
    code: 'JK',
    tagline: 'Paradise on Earth',
    description:
      'Kashmir is a land of unmatched natural beauty — Dal Lake shikaras, Mughal gardens, the Great Lakes trek, and Gulmarg\'s meadows. Discover this paradise with trusted local guides who know every hidden trail.',
    heroImage: '/images/btg/optimized/frame-5.webp',
    highlights: ['Kashmir Great Lakes Trek', 'Dal Lake Shikara', 'Gulmarg Skiing', 'Pahalgam Valley', 'Sonamarg Glacier'],
    bestTimeToVisit: 'March – November',
    popularCities: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Patnitop'],
    isNorthIndia: true,
    isPrimary: true,
  },
  'delhi': {
    slug: 'delhi',
    name: 'Delhi',
    code: 'DL',
    tagline: 'Where India\'s Past Meets Its Future',
    description:
      'Delhi is India\'s capital and a living museum of Mughal, British, and modern Indian heritage. From Chandni Chowk food walks to Mughal architecture trails — experience layers of history with expert city guides.',
    heroImage: '/images/btg/optimized/frame-8.webp',
    highlights: ['Old Delhi Food Walk', 'Mughal Heritage Trail', 'Chandni Chowk Tour', 'Qutub to Mehrauli Walk', 'Lutyens Delhi Cycle Tour'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Old Delhi', 'New Delhi', 'Mehrauli', 'Hauz Khas'],
    isNorthIndia: true,
    isPrimary: true,
  },
  'uttar-pradesh': {
    slug: 'uttar-pradesh',
    name: 'Uttar Pradesh',
    code: 'UP',
    tagline: 'The Heartland of Indian Heritage',
    description:
      'Uttar Pradesh is home to the Taj Mahal, Varanasi ghats, Lucknow\'s nawabi culture, and Vrindavan\'s spiritual trails. Walk through millennia of Indian civilization with knowledgeable local guides.',
    heroImage: '/images/btg/optimized/frame-8.webp',
    highlights: ['Taj Mahal Sunrise Tour', 'Varanasi Ghat Walk', 'Lucknow Heritage Walk', 'Vrindavan Temple Trail', 'Sarnath Buddhist Circuit'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Agra', 'Varanasi', 'Lucknow', 'Mathura', 'Allahabad'],
    isNorthIndia: true,
    isPrimary: true,
  },
  'goa': {
    slug: 'goa',
    name: 'Goa',
    code: 'GA',
    tagline: 'Sun, Sand & Soul',
    description:
      'Goa is more than beaches — explore Portuguese heritage, spice plantations, wildlife sanctuaries, and hidden waterfalls with local guides who reveal the real Goa beyond the tourist trail.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Old Goa Heritage Walk', 'Dudhsagar Waterfall Trek', 'Spice Plantation Tour', 'Fontainhas Latin Quarter', 'Backwater Kayaking'],
    bestTimeToVisit: 'November – February',
    popularCities: ['Panaji', 'Old Goa', 'Palolem', 'Calangute', 'Anjuna'],
    isNorthIndia: false,
    isPrimary: true,
  },
  'kerala': {
    slug: 'kerala',
    name: 'Kerala',
    code: 'KL',
    tagline: 'God\'s Own Country',
    description:
      'Kerala offers everything from serene backwaters and tea plantations to Western Ghats treks and Ayurvedic retreats. Explore Munnar, Wayanad, and Alleppey with passionate local guides.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Alleppey Backwaters', 'Munnar Tea Plantations', 'Wayanad Trek', 'Periyar Wildlife Safari', 'Fort Kochi Heritage Walk'],
    bestTimeToVisit: 'September – March',
    popularCities: ['Kochi', 'Munnar', 'Alleppey', 'Wayanad', 'Thekkady'],
    isNorthIndia: false,
    isPrimary: true,
  },
  'karnataka': {
    slug: 'karnataka',
    name: 'Karnataka',
    code: 'KA',
    tagline: 'One State, Many Worlds',
    description:
      'Karnataka is a treasure chest of Hampi ruins, Coorg coffee estates, Bangalore\'s tech-meets-tradition, and Jog Falls. From Western Ghats treks to Mysore palace walks — adventure and heritage collide.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Hampi Heritage Walk', 'Coorg Coffee Trail', 'Kudremukh Trek', 'Mysore Palace Tour', 'Bangalore Food Walk'],
    bestTimeToVisit: 'October – February',
    popularCities: ['Bangalore', 'Mysore', 'Hampi', 'Coorg', 'Gokarna'],
    isNorthIndia: false,
    isPrimary: true,
  },
  'tamil-nadu': {
    slug: 'tamil-nadu',
    name: 'Tamil Nadu',
    code: 'TN',
    tagline: 'Where Temples Touch the Sky',
    description:
      'Tamil Nadu boasts UNESCO heritage temples, hill stations like Ooty, the French Quarter of Pondicherry, and Nilgiri mountain railways. Discover ancient Dravidian culture with knowledgeable local guides.',
    heroImage: '/images/btg/optimized/frame-8.webp',
    highlights: ['Mahabalipuram Shore Temple', 'Madurai Meenakshi Temple', 'Pondicherry French Quarter', 'Ooty Nilgiri Hills', 'Chettinad Heritage Village'],
    bestTimeToVisit: 'November – February',
    popularCities: ['Chennai', 'Madurai', 'Pondicherry', 'Ooty', 'Thanjavur'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'maharashtra': {
    slug: 'maharashtra',
    name: 'Maharashtra',
    code: 'MH',
    tagline: 'Where History Scales Forts',
    description:
      'Maharashtra is the land of Maratha forts, Ajanta-Ellora caves, the Western Ghats, and Mumbai\'s vibrant street life. Trek to Rajgad, explore Lonavala, or take a heritage walk through colonial Bombay.',
    heroImage: '/images/btg/optimized/frame-7.webp',
    highlights: ['Rajgad Fort Trek', 'Ajanta Ellora Caves', 'Mumbai Heritage Walk', 'Lonavala Day Hike', 'Konkan Coast Drive'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Mumbai', 'Pune', 'Nashik', 'Lonavala', 'Mahabaleshwar'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'west-bengal': {
    slug: 'west-bengal',
    name: 'West Bengal',
    code: 'WB',
    tagline: 'Where Culture Flows Like the Ganges',
    description:
      'West Bengal captivates with Kolkata\'s colonial charm, Darjeeling\'s misty tea gardens, Sundarbans\' mangrove tigers, and Shantiniketan\'s artistic heritage. A land where heritage and nature intertwine.',
    heroImage: '/images/btg/optimized/frame-5.webp',
    highlights: ['Darjeeling Tea Trail', 'Kolkata Heritage Walk', 'Sundarbans Safari', 'Shantiniketan Art Walk', 'Sandakphu Trek'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Kolkata', 'Darjeeling', 'Siliguri', 'Shantiniketan', 'Sundarbans'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'punjab': {
    slug: 'punjab',
    name: 'Punjab',
    code: 'PB',
    tagline: 'The Golden Heartland',
    description:
      'Punjab pulses with the spiritual glow of the Golden Temple, rich Sikh heritage, vibrant Bhangra culture, and legendary Punjabi cuisine. Experience warmth, history, and flavour with local guides.',
    heroImage: '/images/btg/optimized/frame-5.webp',
    highlights: ['Golden Temple Tour', 'Wagah Border Ceremony', 'Amritsar Food Walk', 'Partition Museum', 'Punjab Village Experience'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Amritsar', 'Chandigarh', 'Ludhiana', 'Patiala', 'Anandpur Sahib'],
    isNorthIndia: true,
    isPrimary: false,
  },
  'meghalaya': {
    slug: 'meghalaya',
    name: 'Meghalaya',
    code: 'ML',
    tagline: 'Abode of the Clouds',
    description:
      'Meghalaya is a stunner — living root bridges, the wettest place on Earth, crystal-clear rivers, and rolling Khasi hills. An off-the-beaten-path paradise for nature lovers and trekkers.',
    heroImage: '/images/btg/optimized/frame-7.webp',
    highlights: ['Living Root Bridge Trek', 'Dawki River', 'Cherrapunji Waterfalls', 'Shillong Peak', 'Mawlynnong Cleanest Village'],
    bestTimeToVisit: 'October – May',
    popularCities: ['Shillong', 'Cherrapunji', 'Dawki', 'Tura', 'Mawlynnong'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'sikkim': {
    slug: 'sikkim',
    name: 'Sikkim',
    code: 'SK',
    tagline: 'The Himalayan Jewel',
    description:
      'Sikkim is a pocket-sized paradise — Kanchenjunga views, Buddhist monasteries, Himalayan treks like Goechala, and the cleanest state in India. An eco-traveller\'s dream destination.',
    heroImage: '/images/btg/optimized/frame-7.webp',
    highlights: ['Goechala Trek', 'Pelling Monastery Trail', 'Gangtok City Tour', 'Gurudongmar Lake', 'Zuluk Hairpin Road'],
    bestTimeToVisit: 'March – June, October – December',
    popularCities: ['Gangtok', 'Pelling', 'Lachung', 'Namchi', 'Yuksom'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'assam': {
    slug: 'assam',
    name: 'Assam',
    code: 'AS',
    tagline: 'Gateway to the Northeast',
    description:
      'Assam is a land of tea gardens, the mighty Brahmaputra, one-horned rhinos at Kaziranga, and Majuli — the world\'s largest river island. A gateway to India\'s enchanting Northeast.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Kaziranga Rhino Safari', 'Majuli River Island', 'Assam Tea Garden Tour', 'Kamakhya Temple', 'Brahmaputra River Cruise'],
    bestTimeToVisit: 'November – April',
    popularCities: ['Guwahati', 'Kaziranga', 'Tezpur', 'Jorhat', 'Majuli'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'madhya-pradesh': {
    slug: 'madhya-pradesh',
    name: 'Madhya Pradesh',
    code: 'MP',
    tagline: 'The Heart of Incredible India',
    description:
      'Madhya Pradesh is the tiger capital of India — Bandhavgarh, Kanha, and Pench national parks. Add the temple town of Khajuraho, historic Orchha, and Bhopal\'s lakes for an unforgettable journey.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Bandhavgarh Tiger Safari', 'Khajuraho Temples', 'Orchha Heritage Walk', 'Pachmarhi Hill Station', 'Bhopal Lake Tour'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Bhopal', 'Khajuraho', 'Orchha', 'Kanha', 'Pachmarhi'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'gujarat': {
    slug: 'gujarat',
    name: 'Gujarat',
    code: 'GJ',
    tagline: 'The Land of Legends',
    description:
      'Gujarat is a mosaic of the white Rann of Kutch, Gir\'s Asiatic lions, Somnath\'s ancient temples, and Ahmedabad\'s UNESCO heritage city. Rich in culture, crafts, and culinary traditions.',
    heroImage: '/images/btg/optimized/frame-8.webp',
    highlights: ['Rann of Kutch Festival', 'Gir Lion Safari', 'Ahmedabad Heritage Walk', 'Somnath Temple Trail', 'Statue of Unity'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Ahmedabad', 'Kutch', 'Gir', 'Dwarka', 'Vadodara'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'odisha': {
    slug: 'odisha',
    name: 'Odisha',
    code: 'OD',
    tagline: 'India\'s Best Kept Secret',
    description:
      'Odisha is an undiscovered gem — the Sun Temple of Konark, tribal heritage, pristine Chilika Lake, and ancient Buddhist sites. Rich in art, dance, and temple architecture.',
    heroImage: '/images/btg/optimized/frame-8.webp',
    highlights: ['Konark Sun Temple', 'Puri Jagannath Temple', 'Chilika Lake Bird Watching', 'Tribal Village Tour', 'Bhubaneswar Temple Walk'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Bhubaneswar', 'Puri', 'Konark', 'Chilika', 'Cuttack'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'andhra-pradesh': {
    slug: 'andhra-pradesh',
    name: 'Andhra Pradesh',
    code: 'AP',
    tagline: 'The Koh-i-Noor of India',
    description:
      'Andhra Pradesh blends ancient Buddhist heritage, Tirupati\'s divine pull, Araku Valley\'s tribal beauty, and the Godavari delta. A land of temples, trains, and traditions.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Tirupati Temple Visit', 'Araku Valley Train Journey', 'Lepakshi Temple', 'Gandikota Grand Canyon', 'Srisailam Wildlife'],
    bestTimeToVisit: 'October – February',
    popularCities: ['Visakhapatnam', 'Tirupati', 'Araku', 'Vijayawada', 'Amaravati'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'telangana': {
    slug: 'telangana',
    name: 'Telangana',
    code: 'TS',
    tagline: 'Heritage of the Deccan',
    description:
      'Telangana is anchored by Hyderabad\'s Charminar, Golconda Fort, and legendary biryani. Beyond the city, discover Warangal\'s Kakatiya temples and Nagarjunasagar\'s Buddhist ruins.',
    heroImage: '/images/btg/optimized/frame-8.webp',
    highlights: ['Charminar Old City Walk', 'Golconda Fort Tour', 'Hyderabad Food Walk', 'Warangal Heritage', 'Ramoji Film City'],
    bestTimeToVisit: 'October – February',
    popularCities: ['Hyderabad', 'Warangal', 'Nagarjunasagar', 'Medak', 'Adilabad'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'arunachal-pradesh': {
    slug: 'arunachal-pradesh',
    name: 'Arunachal Pradesh',
    code: 'AR',
    tagline: 'Land of the Dawn-Lit Mountains',
    description:
      'Arunachal Pradesh is India\'s wildest frontier — Tawang monastery, Ziro Valley festivals, pristine tribal cultures, and the eastern Himalayas. A true adventure destination.',
    heroImage: '/images/btg/optimized/frame-7.webp',
    highlights: ['Tawang Monastery', 'Ziro Music Festival', 'Mechuka Valley', 'Sela Pass', 'Namdapha National Park'],
    bestTimeToVisit: 'March – October',
    popularCities: ['Tawang', 'Ziro', 'Itanagar', 'Bomdila', 'Mechuka'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'nagaland': {
    slug: 'nagaland',
    name: 'Nagaland',
    code: 'NL',
    tagline: 'Land of Festivals',
    description:
      'Nagaland is famous for the Hornbill Festival, warrior tribal heritage, Dzukou Valley treks, and authentic Naga cuisine. A cultural immersion like no other in India.',
    heroImage: '/images/btg/optimized/frame-7.webp',
    highlights: ['Hornbill Festival', 'Dzukou Valley Trek', 'Kohima War Cemetery', 'Naga Village Homestay', 'Japfu Peak Trek'],
    bestTimeToVisit: 'October – May',
    popularCities: ['Kohima', 'Dimapur', 'Mokokchung', 'Mon', 'Wokha'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'chhattisgarh': {
    slug: 'chhattisgarh',
    name: 'Chhattisgarh',
    code: 'CG',
    tagline: 'Undiscovered India',
    description:
      'Chhattisgarh is a hidden gem — Chitrakote Falls (India\'s Niagara), Bastar tribal culture, ancient caves, and dense forests. One of India\'s most authentic off-the-beaten-path destinations.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Chitrakote Falls', 'Bastar Tribal Tour', 'Tirathgarh Waterfall', 'Bhoramdeo Temple', 'Barnawapara Wildlife'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Raipur', 'Jagdalpur', 'Bastar', 'Bilaspur', 'Dhamtari'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'jharkhand': {
    slug: 'jharkhand',
    name: 'Jharkhand',
    code: 'JH',
    tagline: 'The Land of Forests',
    description:
      'Jharkhand is rich in tribal heritage, waterfalls, and forested hills. Explore Betla National Park, Hundru Falls, and the ancient rock art of Isko. A nature-lover\'s retreat.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Betla National Park', 'Hundru Falls', 'Parasnath Hill', 'Netarhat Sunrise', 'Deoghar Temple'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Ranchi', 'Jamshedpur', 'Deoghar', 'Hazaribagh', 'Netarhat'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'bihar': {
    slug: 'bihar',
    name: 'Bihar',
    code: 'BR',
    tagline: 'The Cradle of Civilization',
    description:
      'Bihar is the birthplace of Buddhism — Bodh Gaya, Nalanda, Rajgir, and Vaishali. Walk in the footsteps of Buddha and Mahavira with guides who bring ancient history to life.',
    heroImage: '/images/btg/optimized/frame-8.webp',
    highlights: ['Bodh Gaya Meditation Walk', 'Nalanda University Ruins', 'Rajgir Hot Springs', 'Vaishali Buddhist Circuit', 'Patna Heritage Walk'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Patna', 'Bodh Gaya', 'Nalanda', 'Rajgir', 'Vaishali'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'haryana': {
    slug: 'haryana',
    name: 'Haryana',
    code: 'HR',
    tagline: 'Land of the Mahabharata',
    description:
      'Haryana is steeped in Mahabharata lore — Kurukshetra\'s battlefields, Pinjore Gardens, Sultanpur bird sanctuary, and the Aravalli trails of Morni Hills. History and nature in the NCR backyard.',
    heroImage: '/images/btg/optimized/frame-5.webp',
    highlights: ['Kurukshetra Heritage Tour', 'Sultanpur Bird Sanctuary', 'Morni Hills Trek', 'Pinjore Gardens', 'Surajkund Crafts Fair'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Gurgaon', 'Kurukshetra', 'Panchkula', 'Morni', 'Faridabad'],
    isNorthIndia: true,
    isPrimary: false,
  },
  'manipur': {
    slug: 'manipur',
    name: 'Manipur',
    code: 'MN',
    tagline: 'The Jewel of India',
    description:
      'Manipur is home to the floating Loktak Lake, Ima Keithel (the world\'s only all-women market), and rich Meitei culture. A unique Northeast gem waiting to be explored.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Loktak Lake Floating Islands', 'Ima Keithel Market', 'Kangla Fort', 'Keibul Lamjao National Park', 'Ukhrul Hills'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Imphal', 'Ukhrul', 'Churachandpur', 'Senapati', 'Thoubal'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'mizoram': {
    slug: 'mizoram',
    name: 'Mizoram',
    code: 'MZ',
    tagline: 'Land of the Hill People',
    description:
      'Mizoram is a tapestry of rolling green hills, bamboo forests, and vibrant Mizo culture. Explore Aizawl\'s hilltop city, Phawngpui peak, and the unique Anthurium Festival.',
    heroImage: '/images/btg/optimized/frame-7.webp',
    highlights: ['Phawngpui Blue Mountain', 'Aizawl City Walk', 'Tam Dil Lake', 'Vantawng Falls', 'Reiek Heritage Village'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'tripura': {
    slug: 'tripura',
    name: 'Tripura',
    code: 'TR',
    tagline: 'The Land of Fourteen Gods',
    description:
      'Tripura is a compact Northeast state with Ujjayanta Palace, Neermahal water palace, ancient rock carvings at Unakoti, and lush forests. A hidden heritage destination.',
    heroImage: '/images/btg/optimized/frame-8.webp',
    highlights: ['Ujjayanta Palace', 'Neermahal Water Palace', 'Unakoti Rock Sculptures', 'Jampui Hills', 'Sepahijala Wildlife'],
    bestTimeToVisit: 'October – March',
    popularCities: ['Agartala', 'Udaipur', 'Jampui', 'Dharmanagar', 'Kailashahar'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'andaman-nicobar': {
    slug: 'andaman-nicobar',
    name: 'Andaman & Nicobar Islands',
    code: 'AN',
    tagline: 'Emerald Islands of the Bay',
    description:
      'The Andaman Islands offer turquoise waters, pristine coral reefs, WWII history at Cellular Jail, and bioluminescent beaches. India\'s tropical paradise for divers and beach lovers.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Cellular Jail Tour', 'Havelock Scuba Diving', 'Radhanagar Beach', 'Neil Island Snorkeling', 'Baratang Limestone Caves'],
    bestTimeToVisit: 'November – May',
    popularCities: ['Port Blair', 'Havelock', 'Neil Island', 'Baratang', 'Diglipur'],
    isNorthIndia: false,
    isPrimary: false,
  },
  'lakshadweep': {
    slug: 'lakshadweep',
    name: 'Lakshadweep',
    code: 'LD',
    tagline: 'India\'s Coral Paradise',
    description:
      'Lakshadweep is India\'s smallest Union Territory — a chain of 36 coral islands with crystal-clear lagoons, world-class diving, and untouched marine biodiversity.',
    heroImage: '/images/btg/optimized/frame-6.webp',
    highlights: ['Bangaram Island', 'Agatti Lagoon', 'Kavaratti Water Sports', 'Coral Reef Diving', 'Glass-bottom Boat Ride'],
    bestTimeToVisit: 'October – May',
    popularCities: ['Kavaratti', 'Agatti', 'Bangaram', 'Minicoy', 'Kalpeni'],
    isNorthIndia: false,
    isPrimary: false,
  },
};

/** Get all states as an array, ordered: primary first, then alphabetical */
export function getAllStates(): StateInfo[] {
  return Object.values(STATES).sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.name.localeCompare(b.name);
  });
}

/** Get primary (active) states */
export function getPrimaryStates(): StateInfo[] {
  return getAllStates().filter((s) => s.isPrimary);
}

/** Look up a state by its URL slug */
export function getStateBySlug(slug: string): StateInfo | undefined {
  return STATES[slug];
}

/** All state slugs for generateStaticParams */
export function getAllStateSlugs(): string[] {
  return Object.keys(STATES);
}
