import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ============ SUPER ADMIN ============
  const superAdminPw = await bcrypt.hash('SuperAdmin@123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@booktheguide.com' },
    update: {},
    create: {
      email: 'admin@booktheguide.com',
      name: 'Super Admin',
      password: superAdminPw,
      role: 'SUPER_ADMIN',
      phone: '+919876543210',
      emailVerified: new Date(),
    },
  });
  console.log('✅ Super Admin:', superAdmin.email);

  // ============ UI MANAGER ============
  const uiManagerPw = await bcrypt.hash('UIManager@2026', 12);
  const uiManager = await prisma.user.upsert({
    where: { email: 'ui@booktheguide.com' },
    update: {},
    create: {
      email: 'ui@booktheguide.com',
      name: 'UI Manager',
      password: uiManagerPw,
      role: 'UI_MANAGER',
      emailVerified: new Date(),
    },
  });
  console.log('✅ UI Manager:', uiManager.email);

  // ============ INDIAN STATES ============
  const statesData = [
    { name: 'Uttarakhand', code: 'UK', isNorthIndia: true },
    { name: 'Himachal Pradesh', code: 'HP', isNorthIndia: true },
    { name: 'Jammu & Kashmir', code: 'JK', isNorthIndia: true },
    { name: 'Ladakh', code: 'LA', isNorthIndia: true },
    { name: 'Punjab', code: 'PB', isNorthIndia: true },
    { name: 'Haryana', code: 'HR', isNorthIndia: true },
    { name: 'Delhi', code: 'DL', isNorthIndia: true },
    { name: 'Uttar Pradesh', code: 'UP', isNorthIndia: true },
    { name: 'Rajasthan', code: 'RJ', isNorthIndia: true },
    { name: 'Sikkim', code: 'SK', isNorthIndia: false },
    { name: 'West Bengal', code: 'WB', isNorthIndia: false },
    { name: 'Meghalaya', code: 'ML', isNorthIndia: false },
    { name: 'Arunachal Pradesh', code: 'AR', isNorthIndia: false },
    { name: 'Assam', code: 'AS', isNorthIndia: false },
    { name: 'Goa', code: 'GA', isNorthIndia: false },
    { name: 'Maharashtra', code: 'MH', isNorthIndia: false },
    { name: 'Karnataka', code: 'KA', isNorthIndia: false },
    { name: 'Kerala', code: 'KL', isNorthIndia: false },
    { name: 'Tamil Nadu', code: 'TN', isNorthIndia: false },
    { name: 'Madhya Pradesh', code: 'MP', isNorthIndia: false },
    { name: 'Gujarat', code: 'GJ', isNorthIndia: false },
    { name: 'Bihar', code: 'BR', isNorthIndia: false },
    { name: 'Jharkhand', code: 'JH', isNorthIndia: false },
    { name: 'Odisha', code: 'OD', isNorthIndia: false },
    { name: 'Chhattisgarh', code: 'CG', isNorthIndia: false },
    { name: 'Andhra Pradesh', code: 'AP', isNorthIndia: false },
    { name: 'Telangana', code: 'TG', isNorthIndia: false },
    { name: 'Nagaland', code: 'NL', isNorthIndia: false },
    { name: 'Manipur', code: 'MN', isNorthIndia: false },
    { name: 'Mizoram', code: 'MZ', isNorthIndia: false },
    { name: 'Tripura', code: 'TR', isNorthIndia: false },
  ];

  const states: Record<string, any> = {};
  for (const s of statesData) {
    const state = await prisma.indianState.upsert({
      where: { code: s.code },
      update: {},
      create: { name: s.name, code: s.code, isNorthIndia: s.isNorthIndia, isActive: true },
    });
    states[s.code] = state;
  }
  console.log(`✅ ${statesData.length} states`);

  // ============ CITIES ============
  const citiesData = [
    { name: 'Dehradun', sc: 'UK' }, { name: 'Rishikesh', sc: 'UK' },
    { name: 'Haridwar', sc: 'UK' }, { name: 'Mussoorie', sc: 'UK' },
    { name: 'Nainital', sc: 'UK' }, { name: 'Almora', sc: 'UK' },
    { name: 'Chamoli', sc: 'UK' }, { name: 'Uttarkashi', sc: 'UK' },
    { name: 'Rudraprayag', sc: 'UK' }, { name: 'Pithoragarh', sc: 'UK' },
    { name: 'Bageshwar', sc: 'UK' }, { name: 'Joshimath', sc: 'UK' },
    { name: 'Auli', sc: 'UK' }, { name: 'Chopta', sc: 'UK' },
    { name: 'Munsiyari', sc: 'UK' }, { name: 'Kausani', sc: 'UK' },
    { name: 'Binsar', sc: 'UK' }, { name: 'Lansdowne', sc: 'UK' },
    { name: 'Manali', sc: 'HP' }, { name: 'Shimla', sc: 'HP' },
    { name: 'Dharamshala', sc: 'HP' }, { name: 'McLeod Ganj', sc: 'HP' },
    { name: 'Kasol', sc: 'HP' }, { name: 'Dalhousie', sc: 'HP' },
    { name: 'Spiti Valley', sc: 'HP' }, { name: 'Kullu', sc: 'HP' },
    { name: 'Bir Billing', sc: 'HP' }, { name: 'Jibhi', sc: 'HP' },
    { name: 'Tirthan Valley', sc: 'HP' }, { name: 'Chitkul', sc: 'HP' },
    { name: 'Sangla', sc: 'HP' }, { name: 'Chamba', sc: 'HP' },
    { name: 'Srinagar', sc: 'JK' }, { name: 'Gulmarg', sc: 'JK' },
    { name: 'Pahalgam', sc: 'JK' }, { name: 'Sonamarg', sc: 'JK' },
    { name: 'Jammu', sc: 'JK' },
    { name: 'Leh', sc: 'LA' }, { name: 'Nubra Valley', sc: 'LA' },
    { name: 'Pangong', sc: 'LA' }, { name: 'Zanskar', sc: 'LA' },
    { name: 'Jaipur', sc: 'RJ' }, { name: 'Udaipur', sc: 'RJ' },
    { name: 'Jodhpur', sc: 'RJ' }, { name: 'Jaisalmer', sc: 'RJ' },
    { name: 'Pushkar', sc: 'RJ' }, { name: 'Mount Abu', sc: 'RJ' },
    { name: 'Ranthambore', sc: 'RJ' },
    { name: 'New Delhi', sc: 'DL' }, { name: 'Old Delhi', sc: 'DL' },
    { name: 'Gangtok', sc: 'SK' }, { name: 'Pelling', sc: 'SK' },
    { name: 'Yuksom', sc: 'SK' }, { name: 'Lachung', sc: 'SK' },
    { name: 'Darjeeling', sc: 'WB' }, { name: 'Shillong', sc: 'ML' },
    { name: 'Cherrapunji', sc: 'ML' }, { name: 'Dawki', sc: 'ML' },
    { name: 'Tawang', sc: 'AR' }, { name: 'Ziro', sc: 'AR' },
    { name: 'Guwahati', sc: 'AS' }, { name: 'Kaziranga', sc: 'AS' },
    { name: 'Panaji', sc: 'GA' }, { name: 'South Goa', sc: 'GA' },
    { name: 'Mumbai', sc: 'MH' }, { name: 'Pune', sc: 'MH' },
    { name: 'Lonavala', sc: 'MH' }, { name: 'Mahabaleshwar', sc: 'MH' },
    { name: 'Bengaluru', sc: 'KA' }, { name: 'Coorg', sc: 'KA' },
    { name: 'Hampi', sc: 'KA' }, { name: 'Chikmagalur', sc: 'KA' },
    { name: 'Gokarna', sc: 'KA' },
    { name: 'Munnar', sc: 'KL' }, { name: 'Alleppey', sc: 'KL' },
    { name: 'Wayanad', sc: 'KL' }, { name: 'Varkala', sc: 'KL' },
    { name: 'Ooty', sc: 'TN' }, { name: 'Kodaikanal', sc: 'TN' },
    { name: 'Rameshwaram', sc: 'TN' },
    { name: 'Varanasi', sc: 'UP' }, { name: 'Agra', sc: 'UP' },
    { name: 'Lucknow', sc: 'UP' },
    { name: 'Khajuraho', sc: 'MP' }, { name: 'Pachmarhi', sc: 'MP' },
    { name: 'Rann of Kutch', sc: 'GJ' }, { name: 'Gir', sc: 'GJ' },
    { name: 'Kohima', sc: 'NL' },
    { name: 'Bodh Gaya', sc: 'BR' },
  ];

  const cities: Record<string, any> = {};
  for (const c of citiesData) {
    const state = states[c.sc];
    if (!state) continue;
    const city = await prisma.city.upsert({
      where: { name_stateId: { name: c.name, stateId: state.id } },
      update: {},
      create: { name: c.name, stateId: state.id, isActive: true },
    });
    cities[`${c.sc}-${c.name}`] = city;
  }
  console.log(`✅ ${citiesData.length} cities`);

  // ============ REGIONS ============
  const regionsData = [
    { name: 'Garhwal', sc: 'UK', description: 'Western Uttarakhand — Char Dham, Valley of Flowers, and majestic treks' },
    { name: 'Kumaon', sc: 'UK', description: 'Eastern Uttarakhand — Nainital, Almora, Munsiyari, Panchachuli views' },
    { name: 'Kullu Valley', sc: 'HP', description: 'Manali, Solang, gateway to Rohtang and adventure sports' },
    { name: 'Parvati Valley', sc: 'HP', description: 'Kasol, Kheerganga, and the hippie trail of Himachal' },
    { name: 'Spiti Region', sc: 'HP', description: 'Cold desert mountain valley — Key Monastery, Chandratal, Pin Valley' },
    { name: 'Kashmir Valley', sc: 'JK', description: 'Dal Lake, Mughal Gardens, Great Lakes Trek' },
    { name: 'Ladakh Region', sc: 'LA', description: 'High altitude desert — Khardung La, monasteries, Chadar Trek' },
    { name: 'Rajasthan Desert', sc: 'RJ', description: 'Thar Desert, forts, palaces, and camel safaris' },
  ];

  for (const r of regionsData) {
    const state = states[r.sc];
    if (!state) continue;
    await prisma.region.upsert({
      where: { name_stateId: { name: r.name, stateId: state.id } },
      update: {},
      create: { name: r.name, stateId: state.id, description: r.description, isActive: true },
    });
  }
  console.log(`✅ ${regionsData.length} regions`);

  // ============ DESTINATIONS (55+ real destinations) ============
  const destinationsData: { name: string; ck: string; desc: string; alt: number; months: string[]; open?: string[]; avoid?: string[] }[] = [
    // --- Uttarakhand (15) ---
    { name: 'Kedarkantha Trek', ck: 'UK-Uttarkashi', desc: 'Best winter trek in India — summit at 12,500 ft with panoramic Himalayan views', alt: 3810, months: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr'], open: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'], avoid: ['Jul', 'Aug'] },
    { name: 'Har Ki Dun Trek', ck: 'UK-Uttarkashi', desc: 'Cradle of Gods — moderate trek through ancient villages and alpine meadows', alt: 3566, months: ['Apr', 'May', 'Jun', 'Sep', 'Oct'], open: ['Apr', 'May', 'Jun', 'Sep', 'Oct', 'Nov'], avoid: ['Jul', 'Aug', 'Dec', 'Jan', 'Feb'] },
    { name: 'Valley of Flowers', ck: 'UK-Chamoli', desc: 'UNESCO World Heritage Site with 600+ wildflower species', alt: 3658, months: ['Jul', 'Aug', 'Sep'], open: ['Jul', 'Aug', 'Sep'], avoid: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'] },
    { name: 'Chopta Tungnath Trek', ck: 'UK-Chopta', desc: 'Highest Shiva temple trek — Mini Switzerland of India', alt: 3680, months: ['Mar', 'Apr', 'May', 'Oct', 'Nov'], open: ['Mar', 'Apr', 'May', 'Jun', 'Sep', 'Oct', 'Nov', 'Dec'], avoid: ['Jul', 'Aug'] },
    { name: 'Roopkund Trek', ck: 'UK-Chamoli', desc: 'Mystery Lake Trek — the skeleton lake at 15,750 ft', alt: 4800, months: ['May', 'Jun', 'Sep', 'Oct'], open: ['May', 'Jun', 'Sep', 'Oct'], avoid: ['Jul', 'Aug', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] },
    { name: 'Nag Tibba Trek', ck: 'UK-Mussoorie', desc: 'Weekend trek — highest peak in lower Garhwal Himalayas', alt: 3022, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jul', 'Aug'] },
    { name: 'Rishikesh Adventure', ck: 'UK-Rishikesh', desc: 'Rafting, bungee jumping, cliff jumping, camping on the Ganges', alt: 372, months: ['Sep', 'Oct', 'Nov', 'Mar', 'Apr', 'May'], avoid: ['Jul', 'Aug'] },
    { name: 'Auli Skiing', ck: 'UK-Auli', desc: "India's premier ski destination with Nanda Devi views", alt: 3049, months: ['Jan', 'Feb', 'Mar'], open: ['Jan', 'Feb', 'Mar'], avoid: ['Jul', 'Aug'] },
    { name: 'Brahmatal Trek', ck: 'UK-Chamoli', desc: 'Winter trek with Mt. Trishul and Nanda Ghunti views', alt: 3658, months: ['Dec', 'Jan', 'Feb', 'Mar'], open: ['Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jul', 'Aug'] },
    { name: 'Dayara Bugyal Trek', ck: 'UK-Uttarkashi', desc: "Asia's most beautiful alpine meadow at 12,000 ft", alt: 3638, months: ['May', 'Jun', 'Sep', 'Oct', 'Nov'], avoid: ['Jul', 'Aug'] },
    { name: 'Kedarnath Temple', ck: 'UK-Rudraprayag', desc: 'Sacred Jyotirlinga shrine at 11,755 ft — Char Dham pilgrimage', alt: 3583, months: ['May', 'Jun', 'Sep', 'Oct'], open: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'], avoid: ['Dec', 'Jan', 'Feb', 'Mar'] },
    { name: 'Mussoorie Hill Station', ck: 'UK-Mussoorie', desc: 'Queen of Hills — Mall Road, Kempty Falls, Gun Hill', alt: 2005, months: ['Mar', 'Apr', 'May', 'Sep', 'Oct', 'Nov'], avoid: ['Jul', 'Aug'] },
    { name: 'Nainital Lake Tour', ck: 'UK-Nainital', desc: 'Naini Lake boating, Naina Devi temple, Snow View Point', alt: 1938, months: ['Mar', 'Apr', 'May', 'Sep', 'Oct', 'Nov'], avoid: ['Jul', 'Aug'] },
    { name: 'Munsiyari Trek', ck: 'UK-Munsiyari', desc: 'Gateway to Johar Valley — Khaliya Top, Panchachuli views', alt: 2298, months: ['Apr', 'May', 'Jun', 'Sep', 'Oct'], avoid: ['Jul', 'Aug', 'Dec', 'Jan'] },
    { name: 'Binsar Wildlife Sanctuary', ck: 'UK-Binsar', desc: '200+ bird species with 300-km Himalayan panorama', alt: 2420, months: ['Oct', 'Nov', 'Mar', 'Apr', 'May'], avoid: ['Jul', 'Aug'] },

    // --- Himachal Pradesh (12) ---
    { name: 'Hampta Pass Trek', ck: 'HP-Manali', desc: 'Dramatic crossover from lush Kullu to barren Lahaul', alt: 4270, months: ['Jun', 'Jul', 'Aug', 'Sep'], open: ['Jun', 'Jul', 'Aug', 'Sep'], avoid: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] },
    { name: 'Triund Trek', ck: 'HP-McLeod Ganj', desc: 'Easy day trek with jaw-dropping Dhauladhar views', alt: 2875, months: ['Mar', 'Apr', 'May', 'Oct', 'Nov'], avoid: ['Jul', 'Aug'] },
    { name: 'Kheerganga Trek', ck: 'HP-Kasol', desc: 'Natural hot springs through Parvati Valley forest trails', alt: 2960, months: ['Mar', 'Apr', 'May', 'Jun', 'Sep', 'Oct', 'Nov'], avoid: ['Jul', 'Aug', 'Dec', 'Jan'] },
    { name: 'Spiti Valley Circuit', ck: 'HP-Spiti Valley', desc: 'Key Monastery, Chandratal, Dhankar, and Tabo road trip', alt: 3800, months: ['Jun', 'Jul', 'Aug', 'Sep'], open: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'], avoid: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'] },
    { name: 'Bir Billing Paragliding', ck: 'HP-Bir Billing', desc: "Paragliding capital of India — tandem flights over Kangra Valley", alt: 2400, months: ['Mar', 'Apr', 'May', 'Oct', 'Nov'], avoid: ['Jul', 'Aug'] },
    { name: 'Manali Old Town', ck: 'HP-Manali', desc: 'Hadimba Temple, Old Manali cafes, Solang Valley, Vashisht', alt: 2050, months: ['Mar', 'Apr', 'May', 'Jun', 'Oct', 'Nov', 'Dec'] },
    { name: 'Jibhi & Tirthan Valley', ck: 'HP-Jibhi', desc: 'Hidden Himalayan gem — waterfalls, forest walks, and river crossings', alt: 1600, months: ['Mar', 'Apr', 'May', 'Oct', 'Nov', 'Dec'], avoid: ['Jul', 'Aug'] },
    { name: 'Chitkul Village', ck: 'HP-Chitkul', desc: "India's last inhabited village on the Indo-Tibet border", alt: 3450, months: ['May', 'Jun', 'Sep', 'Oct'], open: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], avoid: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'] },
    { name: 'Shimla Heritage Walk', ck: 'HP-Shimla', desc: 'Mall Road, Christ Church, Ridge, Jakhu Temple — colonial hill town', alt: 2276, months: ['Mar', 'Apr', 'May', 'Oct', 'Nov', 'Dec'], avoid: ['Jul', 'Aug'] },
    { name: 'Dalhousie & Khajjiar', ck: 'HP-Dalhousie', desc: "Mini Switzerland of India — colonial charm and pine forests", alt: 1970, months: ['Mar', 'Apr', 'May', 'Sep', 'Oct', 'Nov'], avoid: ['Jul', 'Aug'] },
    { name: 'Sangla Valley', ck: 'HP-Sangla', desc: 'Apple orchards and Kinnaur Kailash views in a hidden Himalayan valley', alt: 2680, months: ['May', 'Jun', 'Sep', 'Oct'], open: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'], avoid: ['Nov', 'Dec', 'Jan', 'Feb'] },
    { name: 'Friendship Peak Trek', ck: 'HP-Manali', desc: 'Technical summit near Manali at 17,350 ft — for experienced trekkers', alt: 5289, months: ['May', 'Jun', 'Sep', 'Oct'], open: ['May', 'Jun', 'Sep', 'Oct'], avoid: ['Jul', 'Aug', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] },

    // --- Jammu & Kashmir (5) ---
    { name: 'Kashmir Great Lakes', ck: 'JK-Sonamarg', desc: "7 alpine lakes in 7 days — India's most beautiful trek", alt: 4200, months: ['Jul', 'Aug', 'Sep'], open: ['Jul', 'Aug', 'Sep'], avoid: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'] },
    { name: 'Tarsar Marsar Trek', ck: 'JK-Pahalgam', desc: 'Twin alpine lake trek through Kashmir meadows', alt: 3850, months: ['Jul', 'Aug', 'Sep'], open: ['Jul', 'Aug', 'Sep'], avoid: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] },
    { name: 'Gulmarg Skiing', ck: 'JK-Gulmarg', desc: "India's top ski resort with world's highest gondola", alt: 2690, months: ['Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jul', 'Aug'] },
    { name: 'Srinagar Heritage Walk', ck: 'JK-Srinagar', desc: 'Dal Lake shikara, Mughal Gardens, Old City, local cuisine', alt: 1585, months: ['Mar', 'Apr', 'May', 'Sep', 'Oct', 'Nov'] },
    { name: 'Pahalgam Valley Trek', ck: 'JK-Pahalgam', desc: 'Betaab Valley, Aru Valley, and Lidder River trails', alt: 2740, months: ['Apr', 'May', 'Jun', 'Sep', 'Oct'], avoid: ['Dec', 'Jan', 'Feb'] },

    // --- Ladakh (4) ---
    { name: 'Markha Valley Trek', ck: 'LA-Leh', desc: 'Classic Ladakh trek through remote villages and high passes', alt: 5200, months: ['Jun', 'Jul', 'Aug', 'Sep'], open: ['Jun', 'Jul', 'Aug', 'Sep'], avoid: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'] },
    { name: 'Chadar Trek', ck: 'LA-Leh', desc: "Walk on the frozen Zanskar River — world's most unique trek", alt: 3400, months: ['Jan', 'Feb'], open: ['Jan', 'Feb'], avoid: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
    { name: 'Leh Ladakh Road Trip', ck: 'LA-Leh', desc: 'Khardung La, Pangong Lake, Nubra Valley circuit', alt: 3500, months: ['Jun', 'Jul', 'Aug', 'Sep'], open: ['Jun', 'Jul', 'Aug', 'Sep'], avoid: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'] },
    { name: 'Stok Kangri Expedition', ck: 'LA-Leh', desc: 'Highest trekkable peak in Ladakh at 20,187 ft — technical climb', alt: 6153, months: ['Jul', 'Aug', 'Sep'], open: ['Jul', 'Aug', 'Sep'], avoid: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'] },

    // --- Rajasthan (5) ---
    { name: 'Jaipur Heritage Tour', ck: 'RJ-Jaipur', desc: 'Pink City — Amber Fort, Hawa Mahal, City Palace', alt: 431, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['May', 'Jun', 'Jul', 'Aug'] },
    { name: 'Jaisalmer Desert Safari', ck: 'RJ-Jaisalmer', desc: 'Camel safari, dune camping, fort walk, Thar sunset', alt: 225, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'], avoid: ['May', 'Jun', 'Jul', 'Aug'] },
    { name: 'Udaipur Lake Tour', ck: 'RJ-Udaipur', desc: 'City of Lakes — boat rides, City Palace, sunset spots', alt: 598, months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], avoid: ['May', 'Jun', 'Jul'] },
    { name: 'Ranthambore Wildlife Safari', ck: 'RJ-Ranthambore', desc: 'Tiger reserve — jeep safari, ancient fort, and jungle camp', alt: 390, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'], open: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], avoid: ['Jul', 'Aug', 'Sep'] },
    { name: 'Pushkar Camel Fair', ck: 'RJ-Pushkar', desc: 'World-famous camel fair, Brahma temple, and sacred lake', alt: 510, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'], avoid: ['May', 'Jun', 'Jul', 'Aug'] },

    // --- Delhi (1) ---
    { name: 'Delhi Heritage Walk', ck: 'DL-Old Delhi', desc: 'Chandni Chowk, Red Fort, Jama Masjid, street food', alt: 216, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['May', 'Jun', 'Jul', 'Aug'] },

    // --- Sikkim (3) ---
    { name: 'Goechala Trek', ck: 'SK-Yuksom', desc: 'Face-to-face with Kanchenjunga — spectacular Sikkim trek', alt: 4940, months: ['Apr', 'May', 'Oct', 'Nov'], open: ['Mar', 'Apr', 'May', 'Oct', 'Nov'], avoid: ['Jun', 'Jul', 'Aug', 'Sep'] },
    { name: 'Gangtok City Tour', ck: 'SK-Gangtok', desc: 'MG Marg, monasteries, Tsomgo Lake, Kanchenjunga views', alt: 1650, months: ['Mar', 'Apr', 'May', 'Oct', 'Nov'] },
    { name: 'Lachung Yumthang Valley', ck: 'SK-Lachung', desc: 'Valley of Flowers of Sikkim — rhododendron blooms and hot springs', alt: 3564, months: ['Mar', 'Apr', 'May', 'Oct', 'Nov'], avoid: ['Jun', 'Jul', 'Aug'] },

    // --- West Bengal (1) ---
    { name: 'Darjeeling Tea Tour', ck: 'WB-Darjeeling', desc: 'Toy train, tea estates, Tiger Hill sunrise, Batasia Loop', alt: 2042, months: ['Mar', 'Apr', 'May', 'Oct', 'Nov'], avoid: ['Jun', 'Jul', 'Aug'] },

    // --- Meghalaya (2) ---
    { name: 'Shillong & Cherrapunji', ck: 'ML-Shillong', desc: 'Living root bridges, Nohkalikai Falls, limestone caves', alt: 1496, months: ['Oct', 'Nov', 'Dec', 'Feb', 'Mar'], avoid: ['Jun', 'Jul', 'Aug'] },
    { name: 'Dawki River & Mawlynnong', ck: 'ML-Dawki', desc: "Asia's cleanest village and crystal-clear Umngot River", alt: 600, months: ['Oct', 'Nov', 'Dec', 'Feb', 'Mar'], avoid: ['Jun', 'Jul', 'Aug'] },

    // --- Arunachal Pradesh (2) ---
    { name: 'Tawang Monastery Tour', ck: 'AR-Tawang', desc: 'Largest monastery in India, Sela Pass, and war memorial', alt: 3048, months: ['Mar', 'Apr', 'May', 'Oct', 'Nov'], open: ['Mar', 'Apr', 'May', 'Sep', 'Oct', 'Nov'], avoid: ['Jun', 'Jul', 'Aug', 'Dec', 'Jan'] },
    { name: 'Ziro Valley Festival', ck: 'AR-Ziro', desc: 'UNESCO World Heritage rice paddies, Apatani tribe culture', alt: 1572, months: ['Mar', 'Apr', 'Sep', 'Oct', 'Nov'], avoid: ['Jun', 'Jul', 'Aug'] },

    // --- Assam (1) ---
    { name: 'Kaziranga Safari', ck: 'AS-Kaziranga', desc: 'One-horned rhino reserve — elephant and jeep safari', alt: 60, months: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'], open: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'], avoid: ['Jun', 'Jul', 'Aug', 'Sep'] },

    // --- Goa (2) ---
    { name: 'North Goa Beach Hop', ck: 'GA-Panaji', desc: 'Baga, Calangute, Anjuna markets, Fort Aguada', alt: 5, months: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jun', 'Jul', 'Aug', 'Sep'] },
    { name: 'South Goa Heritage', ck: 'GA-South Goa', desc: 'Palolem, Old Goa churches, spice plantations, Dudhsagar Falls', alt: 5, months: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jun', 'Jul', 'Aug', 'Sep'] },

    // --- Karnataka (3) ---
    { name: 'Coorg Coffee Trail', ck: 'KA-Coorg', desc: 'Coffee plantations, Abbey Falls, Raja Seat, and misty hills', alt: 1170, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jun', 'Jul', 'Aug'] },
    { name: 'Hampi Heritage Walk', ck: 'KA-Hampi', desc: 'UNESCO ruins — Virupaksha Temple, stone chariot, boulder landscape', alt: 467, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'], avoid: ['Apr', 'May', 'Jun', 'Jul'] },
    { name: 'Gokarna Beach Trek', ck: 'KA-Gokarna', desc: 'Cliff-side beach trek connecting 5 pristine beaches', alt: 10, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jun', 'Jul', 'Aug', 'Sep'] },

    // --- Kerala (3) ---
    { name: 'Munnar Tea Trails', ck: 'KL-Munnar', desc: 'Endless tea gardens, Eravikulam National Park, Mattupetty Dam', alt: 1532, months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jun', 'Jul'] },
    { name: 'Alleppey Houseboat', ck: 'KL-Alleppey', desc: 'Backwater cruise on a traditional Kerala houseboat', alt: 5, months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jun', 'Jul'] },
    { name: 'Wayanad Wildlife Trek', ck: 'KL-Wayanad', desc: 'Chembra Peak heart-shaped lake, Edakkal Caves, Banasura Dam', alt: 780, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jun', 'Jul', 'Aug'] },

    // --- Tamil Nadu (2) ---
    { name: 'Ooty & Coonoor Heritage', ck: 'TN-Ooty', desc: 'Nilgiri Mountain Railway, botanical gardens, Doddabetta Peak', alt: 2240, months: ['Oct', 'Nov', 'Dec', 'Mar', 'Apr', 'May'], avoid: ['Jul', 'Aug'] },
    { name: 'Kodaikanal Trekking', ck: 'TN-Kodaikanal', desc: 'Dolphin Nose, Pillar Rocks, Coakers Walk — princess of hill stations', alt: 2133, months: ['Oct', 'Nov', 'Dec', 'Mar', 'Apr', 'May'], avoid: ['Jul', 'Aug'] },

    // --- Madhya Pradesh (1) ---
    { name: 'Pachmarhi Hill Station', ck: 'MP-Pachmarhi', desc: 'Satpura queen — Bee Falls, Pandav Caves, Dhupgarh sunset', alt: 1067, months: ['Oct', 'Nov', 'Dec', 'Feb', 'Mar'], avoid: ['Jun', 'Jul', 'Aug'] },

    // --- Gujarat (2) ---
    { name: 'Rann of Kutch', ck: 'GJ-Rann of Kutch', desc: 'White salt desert under full moon — Rann Utsav festival', alt: 15, months: ['Nov', 'Dec', 'Jan', 'Feb'], open: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'], avoid: ['Jun', 'Jul', 'Aug', 'Sep'] },
    { name: 'Gir Lion Safari', ck: 'GJ-Gir', desc: 'Last home of Asiatic lions — jeep safari and birding', alt: 152, months: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'], open: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'], avoid: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'] },
  ];

  let destCount = 0;
  for (const d of destinationsData) {
    const city = cities[d.ck];
    if (!city) { console.log(`⚠️  City not found: ${d.ck}`); continue; }
    await prisma.destination.upsert({
      where: { name_cityId: { name: d.name, cityId: city.id } },
      update: { openMonths: d.open || [], avoidMonths: d.avoid || [] },
      create: {
        name: d.name,
        cityId: city.id,
        description: d.desc,
        altitude: d.alt,
        bestMonths: d.months,
        openMonths: d.open || [],
        avoidMonths: d.avoid || [],
        isActive: true,
      },
    });
    destCount++;
  }
  console.log(`✅ ${destCount} destinations`);

  // ============ PLATFORM SETTINGS ============
  const settings = [
    { key: 'default_commission', value: '15', description: 'Default commission %' },
    { key: 'platform_name', value: 'Book The Guide', description: 'Platform name' },
    { key: 'support_email', value: 'support@booktheguide.com', description: 'Support email' },
  ];
  for (const s of settings) {
    await prisma.platformSettings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('✅ Platform settings');

  // ============ DEMO STATE ADMIN ============
  const adminPw = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin.uk@booktheguide.com' },
    update: {},
    create: {
      email: 'admin.uk@booktheguide.com',
      name: 'Uttarakhand Admin',
      password: adminPw,
      role: 'ADMIN',
      phone: '+919876543211',
      emailVerified: new Date(),
    },
  });
  await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      managedStates: { connect: [{ id: states['UK'].id }] },
    },
  });
  console.log('✅ Demo Admin (Uttarakhand)');

  // ============ DEMO GUIDE ============
  const guidePw = await bcrypt.hash('Guide@123', 12);
  const guideUser = await prisma.user.upsert({
    where: { email: 'guide@booktheguide.com' },
    update: {},
    create: {
      email: 'guide@booktheguide.com',
      name: 'Rajesh Kumar',
      password: guidePw,
      role: 'GUIDE',
      phone: '+919876543212',
      emailVerified: new Date(),
    },
  });
  await prisma.guideProfile.upsert({
    where: { userId: guideUser.id },
    update: {},
    create: ({
      userId: guideUser.id,
      slug: 'rajesh-kumar',
      tagline: 'Certified Mountain Guide — Trekking & Adventure',
      bio: 'Born and raised in Uttarakhand, guiding treks for 8+ years. From Kedarkantha to Valley of Flowers, I bring local knowledge, safety, and passion.',
      experienceYears: 8,
      education: 'BSc Adventure Tourism, HNB Garhwal University',
      certifications: ['Certified Mountain Guide (IMF)', 'Wilderness First Aid', 'Rock Climbing Instructor'],
      languages: ['Hindi', 'English', 'Garhwali'],
      specializations: ['TREKKING', 'CAMPING', 'MOUNTAINEERING'],
      isVerified: true,
      isActive: true,
      averageRating: 4.8,
      totalReviews: 42,
      totalTrips: 156,
      idType: 'AADHAAR',
      idNumber: 'XXXX-XXXX-1234',
      serviceAreas: {
        create: {
          stateId: states['UK'].id,
          cities: {
            connect: [
              { id: cities['UK-Dehradun'].id },
              { id: cities['UK-Rishikesh'].id },
              { id: cities['UK-Uttarkashi'].id },
              { id: cities['UK-Chamoli'].id },
            ],
          },
        },
      },
    } as any),
  });
  console.log('✅ Demo Guide: Rajesh Kumar');

  // ============ DEMO CUSTOMER ============
  const custPw = await bcrypt.hash('Customer@123', 12);
  await prisma.user.upsert({
    where: { email: 'customer@booktheguide.com' },
    update: {},
    create: {
      email: 'customer@booktheguide.com',
      name: 'Priya Sharma',
      password: custPw,
      role: 'CUSTOMER',
      phone: '+919876543213',
      emailVerified: new Date(),
    },
  });
  console.log('✅ Demo Customer: Priya Sharma');

  // ============ DEMO GUIDE 2 — for variety across categories ============
  const guide2Pw = await bcrypt.hash('Guide@123', 12);
  const guide2User = await prisma.user.upsert({
    where: { email: 'guide2@booktheguide.com' },
    update: {},
    create: {
      email: 'guide2@booktheguide.com',
      name: 'Ananya Singh',
      password: guide2Pw,
      role: 'GUIDE',
      phone: '+919876543214',
      emailVerified: new Date(),
    },
  });
  const guide2Profile = await prisma.guideProfile.upsert({
    where: { userId: guide2User.id },
    update: {},
    create: ({
      userId: guide2User.id,
      slug: 'ananya-singh',
      tagline: 'Heritage & Cultural Tour Specialist',
      bio: 'Passionate about India\'s rich history and architecture. Certified heritage walk leader with 5+ years of experience.',
      experienceYears: 5,
      education: 'MA History, Delhi University',
      certifications: ['Certified Heritage Walk Leader', 'First Aid Certified'],
      languages: ['Hindi', 'English', 'Urdu'],
      specializations: ['CULTURAL_TOUR', 'CITY_TOUR', 'FOOD_TOUR'],
      isVerified: true,
      isActive: true,
      averageRating: 4.6,
      totalReviews: 28,
      totalTrips: 95,
      idType: 'AADHAAR',
      idNumber: 'XXXX-XXXX-5678',
      serviceAreas: {
        create: {
          stateId: states['DL'].id,
          cities: { connect: [{ id: cities['DL-Old Delhi'].id }] },
        },
      },
    } as any),
  });
  console.log('✅ Demo Guide 2: Ananya Singh');

  // ============ SAMPLE PRODUCTS (Packages) across all 5 categories ============
  // Get guide profiles
  const guideProfile = await prisma.guideProfile.findUnique({ where: { userId: guideUser.id } });
  if (!guideProfile) throw new Error('Guide profile not found');

  // Helper to get destination by name fragment
  const findDest = async (nameFragment: string) => {
    const d = await prisma.destination.findFirst({ where: { name: { contains: nameFragment, mode: 'insensitive' } } });
    return d;
  };

  const kedarkantha = await findDest('Kedarkantha');
  const rishikesh = await findDest('Rishikesh');
  const hamptaPass = await findDest('Hampta Pass');
  const delhiHeritage = await findDest('Delhi Heritage');
  const jaipur = await findDest('Jaipur Heritage');
  const kashmir = await findDest('Kashmir Great Lakes');
  const triund = await findDest('Triund');
  const birBilling = await findDest('Bir Billing');
  const coorg = await findDest('Coorg');
  const hampi = await findDest('Hampi Heritage');

  const productsData = [
    // --- ADVENTURE_GUIDES ---
    {
      title: 'Kedarkantha Winter Trek — Summit at 12,500ft',
      slug: 'kedarkantha-winter-trek',
      description: 'Experience the best winter trek in India with panoramic Himalayan views from the summit. Perfect for beginners and experienced trekkers alike.',
      activityType: 'TREKKING',
      packageCategory: 'ADVENTURE_GUIDES',
      difficultyLevel: 'MODERATE',
      durationDays: 6,
      durationNights: 5,
      guideId: guideProfile.id,
      destId: kedarkantha?.id,
      isTrending: true,
      price: 8999,
      highlights: ['Summit at 12,500 ft', 'Panoramic Himalayan views', 'Snow camping', 'Forest trail through oak & pine'],
      inclusions: ['Guide fees', 'Camping equipment', 'All meals during trek', 'First aid kit'],
      exclusions: ['Travel to base camp', 'Personal trekking gear', 'Insurance'],
    },
    {
      title: 'Rishikesh Adventure Weekend — Rafting, Bungee & Camping',
      slug: 'rishikesh-adventure-weekend',
      description: 'An action-packed weekend in the adventure capital of India with river rafting, bungee jumping, and riverside camping.',
      activityType: 'ADVENTURE_SPORT',
      packageCategory: 'ADVENTURE_GUIDES',
      difficultyLevel: 'EASY',
      durationDays: 3,
      durationNights: 2,
      guideId: guideProfile.id,
      destId: rishikesh?.id,
      isTrending: true,
      price: 5499,
      highlights: ['16 km river rafting', 'Bungee jumping', 'Cliff jumping', 'Riverside camping'],
      inclusions: ['All adventure activities', 'Camping with meals', 'Safety equipment', 'Certified instructors'],
      exclusions: ['Travel to Rishikesh', 'Personal expenses'],
    },
    {
      title: 'Hampta Pass Crossover Trek',
      slug: 'hampta-pass-crossover-trek',
      description: 'Dramatic crossover from lush green Kullu Valley to the barren landscape of Lahaul. One of the most rewarding treks in Himachal.',
      activityType: 'TREKKING',
      packageCategory: 'ADVENTURE_GUIDES',
      difficultyLevel: 'MODERATE',
      durationDays: 5,
      durationNights: 4,
      guideId: guideProfile.id,
      destId: hamptaPass?.id,
      isTrending: false,
      price: 7999,
      highlights: ['Dramatic valley crossover', 'Chandratal Lake visit', 'Alpine meadows', 'Snow bridges'],
      inclusions: ['Guide fees', 'Camping gear', 'All meals', 'Permits'],
      exclusions: ['Travel to Manali', 'Personal gear', 'Insurance'],
    },
    // --- GROUP_TRIPS ---
    {
      title: 'Kashmir Great Lakes — 7 Lakes in 7 Days',
      slug: 'kashmir-great-lakes-trek',
      description: 'India\'s most beautiful trek — walk past 7 stunning alpine lakes in the Kashmir valley with a group of fellow adventurers.',
      activityType: 'TREKKING',
      packageCategory: 'GROUP_TRIPS',
      difficultyLevel: 'DIFFICULT',
      durationDays: 7,
      durationNights: 6,
      guideId: guideProfile.id,
      destId: kashmir?.id,
      isTrending: true,
      price: 14999,
      highlights: ['7 alpine lakes', 'Gadsar Pass at 13,800 ft', 'Pristine meadows', 'Shepherd trails'],
      inclusions: ['Guide & support staff', 'All camping gear', 'All meals', 'First aid', 'Permits'],
      exclusions: ['Travel to Sonamarg', 'Personal trekking gear', 'Insurance'],
    },
    {
      title: 'Triund Weekend Group Trek',
      slug: 'triund-weekend-group-trek',
      description: 'Easy weekend trek with jaw-dropping Dhauladhar mountain views. Perfect for first-time trekkers joining a fun group.',
      activityType: 'TREKKING',
      packageCategory: 'GROUP_TRIPS',
      difficultyLevel: 'EASY',
      durationDays: 2,
      durationNights: 1,
      guideId: guideProfile.id,
      destId: triund?.id,
      isTrending: false,
      price: 2499,
      highlights: ['Dhauladhar mountain views', 'Night camping under stars', 'Bonfire', 'Sunrise point'],
      inclusions: ['Guide', 'Camping gear', 'Dinner & breakfast', 'Bonfire'],
      exclusions: ['Travel to McLeod Ganj', 'Lunch', 'Personal expenses'],
    },
    // --- HERITAGE_WALKS ---
    {
      title: 'Old Delhi Heritage Walk — Chandni Chowk to Jama Masjid',
      slug: 'old-delhi-heritage-walk',
      description: 'Walk through 400 years of history in the lanes of Old Delhi. Red Fort, Jama Masjid, Chandni Chowk, and the best street food you\'ll ever taste.',
      activityType: 'CULTURAL_TOUR',
      packageCategory: 'HERITAGE_WALKS',
      difficultyLevel: 'EASY',
      durationDays: 1,
      durationNights: 0,
      guideId: guide2Profile.id,
      destId: delhiHeritage?.id,
      isTrending: true,
      price: 999,
      highlights: ['Red Fort exterior', 'Jama Masjid', 'Chandni Chowk lanes', 'Street food tasting'],
      inclusions: ['Certified heritage guide', 'Street food tasting', 'Bottled water'],
      exclusions: ['Monument entry fees', 'Transportation', 'Personal purchases'],
    },
    {
      title: 'Jaipur Pink City Heritage Tour',
      slug: 'jaipur-pink-city-heritage-tour',
      description: 'Explore the magnificent forts and palaces of Jaipur — Amber Fort, Hawa Mahal, City Palace, and Jantar Mantar with an expert local guide.',
      activityType: 'CULTURAL_TOUR',
      packageCategory: 'HERITAGE_WALKS',
      difficultyLevel: 'EASY',
      durationDays: 2,
      durationNights: 1,
      guideId: guide2Profile.id,
      destId: jaipur?.id,
      isTrending: false,
      price: 2999,
      highlights: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Jantar Mantar', 'Local bazaar'],
      inclusions: ['Expert guide for 2 days', 'Monument entries', 'Lunch on day 1'],
      exclusions: ['Hotel stay', 'Transportation', 'Dinner'],
    },
    // --- TOURIST_GUIDES ---
    {
      title: 'Coorg Coffee Trail — Plantations, Falls & Misty Hills',
      slug: 'coorg-coffee-trail',
      description: 'A relaxed exploration of Coorg\'s lush coffee plantations, waterfalls, and misty hilltop viewpoints with a knowledgeable local guide.',
      activityType: 'CITY_TOUR',
      packageCategory: 'TOURIST_GUIDES',
      difficultyLevel: 'EASY',
      durationDays: 3,
      durationNights: 2,
      guideId: guide2Profile.id,
      destId: coorg?.id,
      isTrending: false,
      price: 4999,
      highlights: ['Coffee plantation visit', 'Abbey Falls', 'Raja Seat sunset', 'Namdroling Monastery'],
      inclusions: ['Local guide for 3 days', 'Coffee tasting session', 'Plantation tour entry'],
      exclusions: ['Accommodation', 'Meals', 'Transportation'],
    },
    // --- TRAVEL_WITH_INFLUENCERS ---
    {
      title: 'Bir Billing Paragliding — Fly & Create Content',
      slug: 'bir-billing-fly-create',
      description: 'Paraglide over the Kangra Valley and capture stunning aerial footage. Led by a travel content creator who\'ll help you get the best shots.',
      activityType: 'PHOTOGRAPHY_TOUR',
      packageCategory: 'TRAVEL_WITH_INFLUENCERS',
      difficultyLevel: 'EASY',
      durationDays: 3,
      durationNights: 2,
      guideId: guideProfile.id,
      destId: birBilling?.id,
      isTrending: false,
      price: 6999,
      highlights: ['Tandem paragliding flight', 'GoPro footage', 'Content creation tips', 'Sunset photography'],
      inclusions: ['Paragliding flight with video', 'Content creation workshop', 'Accommodation'],
      exclusions: ['Travel to Bir', 'Meals', 'Personal camera gear'],
    },
    {
      title: 'Hampi Ruins Photography Expedition',
      slug: 'hampi-ruins-photography-expedition',
      description: 'Photograph the UNESCO heritage ruins of Hampi with a professional travel photographer. Dawn-to-dusk shooting with expert composition guidance.',
      activityType: 'PHOTOGRAPHY_TOUR',
      packageCategory: 'TRAVEL_WITH_INFLUENCERS',
      difficultyLevel: 'EASY',
      durationDays: 2,
      durationNights: 1,
      guideId: guide2Profile.id,
      destId: hampi?.id,
      isTrending: false,
      price: 3999,
      highlights: ['Sunrise at Virupaksha Temple', 'Stone chariot photography', 'Boulder landscape shots', 'Night photography session'],
      inclusions: ['Photography guide', 'Location scouting', 'Post-processing tips'],
      exclusions: ['Camera equipment', 'Accommodation', 'Meals', 'Monument entries'],
    },
  ];

  let productCount = 0;
  for (const pd of productsData) {
    if (!pd.destId) {
      console.log(`⚠️  Destination not found for: ${pd.title}`);
      continue;
    }
    const product = await prisma.product.upsert({
      where: { slug: pd.slug },
      update: { packageCategory: pd.packageCategory },
      create: {
        title: pd.title,
        slug: pd.slug,
        description: pd.description,
        highlights: pd.highlights,
        activityType: pd.activityType,
        packageCategory: pd.packageCategory,
        difficultyLevel: pd.difficultyLevel,
        durationDays: pd.durationDays,
        durationNights: pd.durationNights,
        inclusions: pd.inclusions,
        exclusions: pd.exclusions,
        itinerary: JSON.parse('[]'),
        cancellationPolicy: JSON.parse(JSON.stringify([{ hours: 72, refundPercent: 100 }, { hours: 24, refundPercent: 0 }])),
        isTrending: pd.isTrending,
        status: 'APPROVED',
        isActive: true,
        guideId: pd.guideId,
        destinationId: pd.destId,
      },
    });

    // Create a fixed departure for each product (starting in the next 2–8 weeks)
    const startOffset = 14 + Math.floor(Math.random() * 42); // 14-56 days from now
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + startOffset);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + pd.durationDays - 1);

    await prisma.fixedDeparture.upsert({
      where: { id: `seed-dep-${pd.slug}` },
      update: {},
      create: {
        id: `seed-dep-${pd.slug}`,
        productId: product.id,
        startDate,
        endDate,
        pricePerPerson: pd.price,
        totalSeats: 15,
        bookedSeats: Math.floor(Math.random() * 8),
        meetingPoint: `Base camp / city center`,
        maxGroupSize: 15,
        minGroupSize: 2,
        genderPolicy: 'MIXED',
        isActive: true,
        approvalStatus: 'APPROVED',
      },
    });

    productCount++;
  }
  console.log(`✅ ${productCount} sample products with departures`);

  console.log('\n🎉 Seeding complete!\n');
  console.log('Demo Accounts:');
  console.log('  Super Admin:  admin@booktheguide.com / SuperAdmin@123');
  console.log('  State Admin:  admin.uk@booktheguide.com / Admin@123');
  console.log('  Guide:        guide@booktheguide.com / Guide@123');
  console.log('  Guide 2:      guide2@booktheguide.com / Guide@123');
  console.log('  Customer:     customer@booktheguide.com / Customer@123');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
