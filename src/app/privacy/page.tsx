import type { Metadata } from 'next';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';
import { WPSeoContentBlock } from '@/components/wordpress/WPContentBlocks';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('privacy');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Privacy Policy — Legal | Book The Guide',
      description: 'Read how Book The Guide collects, uses, and protects your personal information. We take your privacy seriously.',
      url: 'https://www.booktheguide.com/privacy',
    });
  }
  return {
    title: 'Privacy Policy — Legal | Book The Guide',
    description: 'Read how Book The Guide collects, uses, and protects your personal information. We take your privacy seriously.',
    alternates: { canonical: 'https://www.booktheguide.com/privacy' },
  };
}

export default async function PrivacyPolicyPage() {
  const wp = await getPageContent('privacy');
  const sections = [
    {
      title: '1. Information We Collect',
      content:
        'We collect personal information you provide when registering, booking a guide, or contacting us — including your name, email address, phone number, and payment details. We also automatically collect device information, IP address, browser type, and usage data through cookies and similar technologies.',
    },
    {
      title: '2. How We Use Your Information',
      content:
        'Your information is used to process bookings, communicate with you about trips, improve our platform, personalise recommendations, prevent fraud, and comply with legal obligations. We may also use anonymised data for analytics and product improvement.',
    },
    {
      title: '3. Information Sharing',
      content:
        'We share your details with guides only after a confirmed booking. We do not sell your personal information to third parties. We may share data with payment processors (Razorpay), analytics providers, and law enforcement when legally required.',
    },
    {
      title: '4. Data Security',
      content:
        'We implement industry-standard security measures including SSL encryption, secure password hashing (bcrypt), and access controls to protect your data. However, no method of electronic transmission or storage is 100% secure.',
    },
    {
      title: '5. Cookies & Tracking',
      content:
        'We use essential cookies for authentication and session management, and optional analytics cookies to understand how you use our platform. You can disable non-essential cookies through your browser settings.',
    },
    {
      title: '6. Your Rights',
      content:
        'You have the right to access, correct, or delete your personal data. You can update your profile information from your dashboard or contact us to request data deletion. We will respond to requests within 30 days.',
    },
    {
      title: '7. Data Retention',
      content:
        'We retain your personal information for as long as your account is active or as needed to provide services. Booking records are maintained for 7 years for tax and legal compliance. You may request account deletion at any time.',
    },
    {
      title: '8. Children\'s Privacy',
      content:
        'Our platform is not intended for children under 18. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal data, please contact us immediately.',
    },
    {
      title: '9. Changes to This Policy',
      content:
        'We may update this privacy policy from time to time. We will notify you of significant changes via email or a prominent notice on our platform. Your continued use after changes constitutes acceptance.',
    },
    {
      title: '10. Contact Us',
      content:
        'For privacy-related questions or requests, contact us at privacy@booktheguide.com or through our Contact page. Our Data Protection Officer can be reached at the same address.',
    },
  ];

  return (
    <div className="bg-btg-cream min-h-screen">
      {/* Hero */}
      <section className="bg-[#1A1A18] pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">Legal</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white/60 text-sm font-body">Last updated: January 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto space-y-10">
          <p className="text-[#6B6560] leading-relaxed font-body">
            At Book The Guide, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information when you use our platform.
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
