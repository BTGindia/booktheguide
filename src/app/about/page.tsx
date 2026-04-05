import type { Metadata } from 'next';
import { Users, Shield, Heart, Globe } from 'lucide-react';
import Link from 'next/link';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';
import { WPFaqSection, WPSeoContentBlock, WPInternalLinksGrid, WPPageSections } from '@/components/wordpress/WPContentBlocks';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('about');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'About Us — India\'s Trusted Guide Booking Platform | Book The Guide',
      description: 'Learn about Book The Guide — India\'s premier platform connecting travellers with verified local guides for treks, heritage walks, city tours, and adventure trips across 25+ states.',
      url: 'https://www.booktheguide.com/about',
    });
  }
  return {
    title: 'About Us — India\'s Trusted Guide Booking Platform | Book The Guide',
    description: 'Learn about Book The Guide — India\'s premier platform connecting travellers with verified local guides for treks, heritage walks, city tours, and adventure trips across 25+ states.',
    keywords: 'about Book The Guide, guide booking platform India, verified guides India, travel platform India, adventure guides, heritage walks, trek guides',
    openGraph: {
      title: 'About Us | Book The Guide',
      description: 'India\'s premier platform for booking verified local guides. 500+ guides, 50+ destinations, 10,000+ happy travellers.',
      url: 'https://www.booktheguide.com/about',
    },
    alternates: { canonical: 'https://www.booktheguide.com/about' },
  };
}

const values = [
  {
    icon: Shield,
    title: 'Safety First',
    description: 'Every guide is verified and reviewed. Your safety is our top priority on every adventure.',
  },
  {
    icon: Heart,
    title: 'Local Expertise',
    description: 'Our guides are locals who know the terrain, culture, and hidden gems like no one else.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'We empower local communities by connecting them with travellers who value authentic experiences.',
  },
  {
    icon: Globe,
    title: 'Responsible Tourism',
    description: 'We promote eco-friendly and sustainable travel practices that protect India\'s natural beauty.',
  },
];

const stats = [
  { number: '500+', label: 'Verified Guides' },
  { number: '50+', label: 'Destinations' },
  { number: '10,000+', label: 'Happy Travellers' },
  { number: '4.8', label: 'Average Rating' },
];

const team = [
  { name: 'The Vision', description: 'Created by travellers, for travellers. We understand the frustration of planning trips without reliable local guidance.' },
  { name: 'Our Mission', description: 'To make every Indian adventure safe, memorable, and authentic by connecting you with the best local guides.' },
  { name: 'Our Promise', description: 'Transparent pricing, verified guides, genuine reviews, and responsive support &mdash; always.' },
];

export default async function AboutPage() {
  const wp = await getPageContent('about');

  const wpValues = [
    {
      icon: Shield,
      title: wp.plainText('value_1_title', 'Safety First'),
      description: wp.plainText('value_1_desc', 'Every guide is verified and reviewed. Your safety is our top priority on every adventure.'),
    },
    {
      icon: Heart,
      title: wp.plainText('value_2_title', 'Local Expertise'),
      description: wp.plainText('value_2_desc', 'Our guides are locals who know the terrain, culture, and hidden gems like no one else.'),
    },
    {
      icon: Users,
      title: wp.plainText('value_3_title', 'Community Driven'),
      description: wp.plainText('value_3_desc', 'We empower local communities by connecting them with travellers who value authentic experiences.'),
    },
    {
      icon: Globe,
      title: wp.plainText('value_4_title', 'Responsible Tourism'),
      description: wp.plainText('value_4_desc', 'We promote eco-friendly and sustainable travel practices that protect India\'s natural beauty.'),
    },
  ];

  const wpStats = [
    { number: wp.plainText('stat_1_number', '500+'), label: wp.plainText('stat_1_label', 'Verified Guides') },
    { number: wp.plainText('stat_2_number', '50+'), label: wp.plainText('stat_2_label', 'Destinations') },
    { number: wp.plainText('stat_3_number', '10,000+'), label: wp.plainText('stat_3_label', 'Happy Travellers') },
    { number: wp.plainText('stat_4_number', '4.8'), label: wp.plainText('stat_4_label', 'Average Rating') },
  ];

  const wpTeam = [
    { name: wp.plainText('card_1_title', 'The Vision'), description: wp.plainText('card_1_desc', 'Created by travellers, for travellers. We understand the frustration of planning trips without reliable local guidance.') },
    { name: wp.plainText('card_2_title', 'Our Mission'), description: wp.plainText('card_2_desc', 'To make every Indian adventure safe, memorable, and authentic by connecting you with the best local guides.') },
    { name: wp.plainText('card_3_title', 'Our Promise'), description: wp.text('card_3_desc', 'Transparent pricing, verified guides, genuine reviews, and responsive support &mdash; always.') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-btg-dark py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-btg-blush mb-4">{wp.plainText('hero_label', 'Our Story')}</p>
          <h1 className="font-heading text-[clamp(36px,5vw,58px)] font-normal leading-[1.1] text-btg-cream mb-5"
              dangerouslySetInnerHTML={{ __html: wp.text('hero_title', 'About <em class="italic text-btg-blush">Book The Guide</em>') }} />
          <p className="text-lg text-btg-cream/60 max-w-3xl mx-auto font-light">
            {wp.plainText('hero_description', "India's trusted platform connecting adventurous travellers with verified local guides for unforgettable experiences across the Himalayas and beyond.")}
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 lg:py-24 bg-btg-cream">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h2 className="font-heading text-3xl lg:text-4xl font-normal text-btg-dark text-center mb-8">{wp.plainText('story_heading', 'Our Story')}</h2>
          <div className="space-y-5 text-btg-mid leading-relaxed"
               dangerouslySetInnerHTML={{ __html: wp.text('story_content', `<p>Book The Guide was born from a simple observation: India has incredible destinations, but finding a reliable, experienced guide shouldn't be a matter of luck. Too many travellers arrive at trailheads or tourist spots, only to deal with unverified touts or overpay for mediocre service.</p><p>We set out to create a platform where experienced local guides can showcase their expertise, set fair prices, and connect directly with travellers who value safety, knowledge, and authentic experiences.</p><p>Starting with North India — the majestic Himalayas of Uttarakhand, the valleys of Himachal Pradesh, the adventure capital Rishikesh, and the spiritual trails of Kashmir — we're building a community of guides and travellers united by a love for exploration.</p>`) }} />
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-btg-sand">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {wpStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-heading font-normal text-btg-terracotta">{stat.number}</p>
                <p className="text-btg-mid mt-1 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24 bg-btg-cream">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="font-heading text-3xl lg:text-4xl font-normal text-btg-dark text-center mb-12">{wp.plainText('values_heading', 'What We Stand For')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {wpValues.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-14 h-14 rounded-[16px] bg-btg-blush/30 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-7 w-7 text-btg-terracotta" />
                </div>
                <h3 className="font-heading text-lg font-medium text-btg-dark mb-2">{value.title}</h3>
                <p className="text-sm text-btg-mid">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission/Vision/Promise */}
      <section className="py-16 bg-btg-sand">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {wpTeam.map((item) => (
              <div key={item.name} className="bg-white rounded-[20px] p-6 border border-btg-sand">
                <h3 className="font-heading text-lg font-medium text-btg-terracotta mb-3">{item.name}</h3>
                <p className="text-btg-mid text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-btg-cream">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-heading text-3xl lg:text-4xl font-normal text-btg-dark text-center mb-12">{wp.plainText('how_it_works_heading', 'How It Works')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: wp.plainText('step_1_title', 'Search & Compare'), desc: wp.plainText('step_1_desc', 'Find guides by destination, activity, or dates. Compare ratings, prices, and reviews.') },
              { step: '02', title: wp.plainText('step_2_title', 'Book Instantly'), desc: wp.plainText('step_2_desc', 'Choose a fixed departure or book a guide for your custom dates. Confirmation is instant.') },
              { step: '03', title: wp.plainText('step_3_title', 'Adventure Awaits'), desc: wp.plainText('step_3_desc', 'Meet your guide and enjoy a safe, authentic adventure. Share your experience via a review.') },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-heading font-normal text-btg-blush/60 mb-4">{item.step}</div>
                <h3 className="font-heading text-lg font-medium text-btg-dark mb-2">{item.title}</h3>
                <p className="text-sm text-btg-mid">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-btg-dark">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-heading text-3xl lg:text-4xl font-normal text-btg-cream mb-4">{wp.plainText('cta_title', 'Ready to Explore?')}</h2>
          <p className="text-lg text-btg-cream/50 mb-8 font-light">
            {wp.plainText('cta_description', 'Find your perfect guide and start your next adventure today.')}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/search"
              className="px-8 py-3.5 bg-btg-terracotta text-white rounded-full font-medium text-sm hover:bg-btg-rust transition-colors"
            >
              Find a Guide
            </Link>
            <Link
              href="/register"
              className="px-8 py-3.5 border border-btg-cream/30 text-btg-cream rounded-full font-medium text-sm hover:bg-btg-cream/10 transition-colors"
            >
              Become a Guide
            </Link>
          </div>
        </div>
      </section>

      {/* JSON-LD: Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Book The Guide',
            url: 'https://www.booktheguide.com',
            logo: 'https://www.booktheguide.com/og-image.jpg',
            description: "India's premier platform connecting travellers with verified local guides for treks, heritage walks, city tours, and adventure trips.",
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+91-98765-43210',
              contactType: 'customer service',
              areaServed: 'IN',
              availableLanguage: ['English', 'Hindi'],
            },
            sameAs: [
              'https://instagram.com/booktheguide',
              'https://youtube.com/@booktheguide',
              'https://x.com/booktheguide',
              'https://linkedin.com/company/booktheguide',
              'https://facebook.com/booktheguide',
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.booktheguide.com' },
              { '@type': 'ListItem', position: 2, name: 'About Us', item: 'https://www.booktheguide.com/about' },
            ],
          }),
        }}
      />

      {/* WordPress-managed content sections */}
      <WPPageSections sections={wp.sections} />
      <WPSeoContentBlock content={wp.seoContentBlock} />
      <WPFaqSection faqs={wp.faqItems} />
      <WPInternalLinksGrid links={wp.internalLinks} heading="Explore More" />
    </div>
  );
}
