import type { Metadata } from 'next';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';
import { WPSeoContentBlock } from '@/components/wordpress/WPContentBlocks';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('terms');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Terms of Service — Legal | Book The Guide',
      description: 'Read the Terms of Service for Book The Guide — India\'s guide booking platform. Understand our booking, cancellation, and user policies.',
      url: 'https://www.booktheguide.com/terms',
    });
  }
  return {
    title: 'Terms of Service — Legal | Book The Guide',
    description: 'Read the Terms of Service for Book The Guide — India\'s guide booking platform. Understand our booking, cancellation, and user policies.',
    alternates: { canonical: 'https://www.booktheguide.com/terms' },
  };
}

export default async function TermsPage() {
  const wp = await getPageContent('terms');
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content:
        'By accessing or using Book The Guide ("Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform. These terms apply to all users including customers, guides, and administrators.',
    },
    {
      title: '2. Account Registration',
      content:
        'You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your password and for all activities under your account. You must be at least 18 years old to create an account.',
    },
    {
      title: '3. Bookings & Payments',
      content:
        'All bookings are subject to guide availability and confirmation. Prices displayed include the guide fee and platform commission. Payments are processed securely through Razorpay. Full payment is required at the time of booking unless otherwise specified.',
    },
    {
      title: '4. Cancellation & Refunds',
      content:
        'Cancellation policies vary by trip type and guide. Fixed departure cancellations made 7+ days before departure are eligible for a full refund minus processing fees. Cancellations within 48 hours of departure are non-refundable. Personal booking cancellation terms are set by individual guides.',
    },
    {
      title: '5. Guide Responsibilities',
      content:
        'Guides registered on the platform agree to provide services as described in their listings, maintain accurate availability, respond to booking requests within 48 hours, and comply with all local laws and safety regulations. Guides set their own prices and itineraries.',
    },
    {
      title: '6. Customer Responsibilities',
      content:
        'Customers agree to provide accurate booking information, arrive at meeting points on time, follow the guide\'s safety instructions, treat guides and fellow travellers with respect, and comply with local laws and customs during trips.',
    },
    {
      title: '7. Reviews & Content',
      content:
        'Only customers who have completed a trip may leave reviews. Reviews must be honest, relevant, and respectful. We reserve the right to remove reviews that contain offensive language, false information, or violate our community guidelines.',
    },
    {
      title: '8. Intellectual Property',
      content:
        'All content on the platform including text, images, logos, and software is the property of Book The Guide or its licensors. You may not copy, modify, distribute, or create derivative works without our written permission.',
    },
    {
      title: '9. Limitation of Liability',
      content:
        'Book The Guide acts as a marketplace connecting travellers with guides. We are not liable for injuries, losses, or damages occurring during trips. We do not guarantee the accuracy of guide listings or reviews. Our total liability shall not exceed the amount paid for the specific booking in question.',
    },
    {
      title: '10. Dispute Resolution',
      content:
        'Any disputes between customers and guides should first be reported to our support team. We will attempt to mediate in good faith. If a resolution cannot be reached, disputes will be governed by the laws of India and subject to the jurisdiction of courts in New Delhi.',
    },
    {
      title: '11. Platform Modifications',
      content:
        'We reserve the right to modify, suspend, or discontinue any part of the platform at any time. We will provide reasonable notice for significant changes. Continued use after modifications constitutes acceptance of the updated terms.',
    },
    {
      title: '12. Contact',
      content:
        'For questions about these Terms of Service, contact us at legal@booktheguide.com or through our Contact page.',
    },
  ];

  return (
    <div className="bg-btg-cream min-h-screen">
      {/* Hero */}
      <section className="bg-[#1A1A18] pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">Legal</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-white/60 text-sm font-body">Last updated: January 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto space-y-10">
          <p className="text-[#6B6560] leading-relaxed font-body">
            Welcome to Book The Guide. These Terms of Service govern your use of our platform and the services we provide. Please read them carefully before using our services.
          </p>

          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-heading text-xl font-bold text-[#1A1A18] mb-3">{section.title}</h2>
              <p className="text-[#6B6560] leading-relaxed font-body text-[15px]">{section.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WordPress-managed SEO content */}
      <WPSeoContentBlock content={wp.seoContentBlock} />
    </div>
  );
}
