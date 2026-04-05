import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Clock, MessageSquare } from 'lucide-react';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';
import { WPFaqSection, WPSeoContentBlock, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('contact');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Contact Us — Get Help & Support | Book The Guide',
      description: 'Get in touch with Book The Guide. Questions about bookings, guide partnerships, custom trips, or support? We respond within 24 hours.',
      url: 'https://www.booktheguide.com/contact',
    });
  }
  return {
    title: 'Contact Us — Get Help & Support | Book The Guide',
    description: 'Get in touch with Book The Guide. Questions about bookings, guide partnerships, custom trips, or support? We respond within 24 hours.',
    keywords: 'contact Book The Guide, travel support India, booking help, guide partnership, custom trip enquiry',
    openGraph: {
      title: 'Contact Us | Book The Guide',
      description: 'Get in touch with Book The Guide for travel inquiries and guide partnerships.',
      url: 'https://www.booktheguide.com/contact',
    },
    alternates: { canonical: 'https://www.booktheguide.com/contact' },
  };
}

export default async function ContactPage() {
  const wp = await getPageContent('contact');

  return (
    <div>
      {/* Hero */}
      <section className="bg-btg-dark py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-btg-blush mb-3">{wp.plainText('hero_label', 'Reach Out')}</p>
          <h1 className="font-heading text-[clamp(36px,5vw,58px)] font-normal leading-[1.1] text-btg-cream mb-4"
              dangerouslySetInnerHTML={{ __html: wp.text('hero_title', 'Contact <em class="italic text-btg-blush">Us</em>') }} />
          <p className="text-lg text-btg-cream/50 max-w-2xl mx-auto font-light">
            {wp.plainText('hero_description', "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.")}
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-btg-cream">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="font-heading text-2xl font-normal text-btg-dark mb-6">{wp.plainText('contact_heading', 'Get In Touch')}</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-btg-blush/30 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-btg-terracotta" />
                  </div>
                  <div>
                    <h3 className="font-medium text-btg-dark">Office</h3>
                    <p className="text-sm text-btg-mid mt-1"
                       dangerouslySetInnerHTML={{ __html: wp.text('office_address', 'Dehradun, Uttarakhand<br />India - 248001') }} />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-btg-blush/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-btg-terracotta" />
                  </div>
                  <div>
                    <h3 className="font-medium text-btg-dark">Email</h3>
                    <p className="text-sm text-btg-mid mt-1"
                       dangerouslySetInnerHTML={{ __html: wp.text('email_addresses', 'hello@booktheguide.com<br />support@booktheguide.com') }} />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-btg-blush/30 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-btg-terracotta" />
                  </div>
                  <div>
                    <h3 className="font-medium text-btg-dark">Phone</h3>
                    <p className="text-sm text-btg-mid mt-1"
                       dangerouslySetInnerHTML={{ __html: wp.text('phone_numbers', '+91 98765 43210<br />Mon - Sat, 9 AM - 7 PM IST') }} />
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-btg-blush/30 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-btg-terracotta" />
                  </div>
                  <div>
                    <h3 className="font-medium text-btg-dark">Response Time</h3>
                    <p className="text-sm text-btg-mid mt-1">
                      {wp.plainText('response_time', 'We typically respond within 24 hours')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[20px] p-8 border border-btg-sand">
                <h2 className="font-heading text-2xl font-normal text-btg-dark mb-6">Send Us a Message</h2>
                <form className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Your name"
                        className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">
                      Subject *
                    </label>
                    <select className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition appearance-none">
                      <option value="">Select a topic</option>
                      <option value="booking">Booking Inquiry</option>
                      <option value="guide">Become a Guide</option>
                      <option value="support">Customer Support</option>
                      <option value="partnership">Business Partnership</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">
                      Message *
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Tell us how we can help..."
                      className="w-full px-4 py-2.5 border border-btg-sand rounded-[16px] bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3.5 bg-btg-terracotta text-white rounded-full text-sm font-medium hover:bg-btg-rust transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-btg-sand">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h2 className="font-heading text-2xl lg:text-3xl font-normal text-btg-dark text-center mb-8">
            {wp.plainText('faq_heading', 'Frequently Asked Questions')}
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'How do I book a guide?',
                a: 'Search for guides by destination, activity, or dates. Choose a fixed departure or book a guide for your custom dates. Your booking is confirmed instantly based on availability.',
              },
              {
                q: 'Are the guides verified?',
                a: 'Yes! Every guide on our platform goes through a verification process including ID verification and background checks. Look for the verified badge on guide profiles.',
              },
              {
                q: 'What is your cancellation policy?',
                a: 'Each guide sets their own cancellation policy, which is clearly displayed on their profile and during booking. Make sure to review it before confirming.',
              },
              {
                q: 'How do I become a guide?',
                a: 'Register as a guide, complete your profile with certifications and experience, and start creating tour packages. Our admin team will review and approve your listings.',
              },
              {
                q: 'Is my payment safe?',
                a: 'All payments are processed securely. We hold the payment until your trip is completed, ensuring both travellers and guides are protected.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-[16px] border border-btg-sand p-6">
                <h3 className="font-heading text-base font-medium text-btg-dark">{faq.q}</h3>
                <p className="text-sm text-btg-mid mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WordPress-managed content */}
      <WPSeoContentBlock content={wp.seoContentBlock} />
      <WPFaqSection faqs={wp.faqItems} />
      <WPInternalLinksGrid links={wp.internalLinks} heading="Explore More" />
    </div>
  );
}
