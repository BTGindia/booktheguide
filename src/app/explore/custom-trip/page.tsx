import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MapPin, Calendar, Users, MessageCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { getActiveStates } from '@/lib/active-packages';

export const metadata: Metadata = {
  title: 'Book a Custom Trip — Tailor-Made Travel Experiences | Book The Guide',
  description:
    'Design your perfect trip with a verified local guide. Tell us your preferences, budget, and dates — we\'ll connect you with the ideal guide to craft a custom itinerary just for you.',
  keywords:
    'custom trip India, personalized travel, tailor-made tour, custom itinerary, private guide India, bespoke travel experience',
  openGraph: {
    title: 'Book a Custom Trip | Book The Guide',
    description: 'Design your perfect trip with a verified local guide.',
  },
};

export default async function CustomTripPage() {
  const activeStates = await getActiveStates();

  return (
    <main className="bg-[#F5F0E8] min-h-screen">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative h-[60vh] min-h-[460px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A18] via-[#1A1A18]/90 to-[#58bdae]/40" />
        <div className="absolute inset-0 opacity-15 bg-[url('/images/btg/optimized/frame-5.webp')] bg-cover bg-center" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF7F50] via-[#58bdae] to-[#FF7F50]" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#FF7F50]/15 backdrop-blur-sm px-5 py-2 rounded-full mb-6 border border-[#FF7F50]/30">
            <Sparkles className="w-4 h-4 text-[#FF7F50]" />
            <span className="text-xs font-bold tracking-[0.18em] uppercase text-white/80 font-heading">
              Tailor-Made Travel
            </span>
          </div>
          <h1 className="font-heading text-[clamp(36px,6vw,68px)] font-bold text-white mb-5 leading-tight">
            Your Trip, <span className="text-[#58bdae]">Your Way</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-body max-w-2xl mx-auto leading-relaxed">
            Tell us where you want to go, when, and how — we&apos;ll connect you with the perfect verified guide to design a custom experience just for you.
          </p>
        </div>
      </section>

      {/* ═══════════════ BREADCRUMB ═══════════════ */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-4">
        <nav className="flex items-center gap-2 text-sm text-[#6B6560] font-body">
          <Link href="/" className="hover:text-[#58bdae] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/explore" className="hover:text-[#58bdae] transition-colors">Explore</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1A1A18] font-semibold">Custom Trip</span>
        </nav>
      </div>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="py-14 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">How It Works</p>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-bold text-[#1A1A18] mb-3">
              3 Simple Steps to Your <span className="text-[#58bdae]">Dream Trip</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: <MessageCircle className="w-7 h-7" />, title: 'Share Your Vision', desc: 'Tell us your destination, dates, group size, interests, and budget. The more details, the better we can match you.' },
              { step: '02', icon: <Users className="w-7 h-7" />, title: 'Get Matched', desc: 'We\'ll connect you with verified local guides who specialize in your chosen destination and experience type.' },
              { step: '03', icon: <MapPin className="w-7 h-7" />, title: 'Travel Your Way', desc: 'Your guide crafts a custom itinerary. Approve it, book securely online, and set off on your adventure.' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-8 border border-[#EDE8DF] hover:border-[#58bdae] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(88,189,174,0.12)] transition-all duration-300 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#58bdae]/10 flex items-center justify-center mx-auto mb-5 text-[#58bdae]">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-[#FF7F50] tracking-[0.2em] mb-2 font-heading">{item.step}</div>
                <h3 className="font-heading text-lg font-bold text-[#1A1A18] mb-2">{item.title}</h3>
                <p className="text-sm text-[#6B6560] font-body leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CUSTOM TRIP FORM PLACEHOLDER ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">Get Started</p>
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-bold text-[#1A1A18] mb-3">
              Plan Your Custom Trip
            </h2>
            <p className="text-[#6B6560] font-body max-w-xl mx-auto">
              Fill in the details below and our team will get back to you within 24 hours with guide recommendations.
            </p>
          </div>

          <div className="bg-[#F5F0E8] rounded-2xl p-8 md:p-10 border border-[#EDE8DF]">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-2 font-heading">Your Name</label>
                  <input type="text" placeholder="Enter your full name" className="w-full px-4 py-3 bg-white rounded-xl border border-[#EDE8DF] text-sm font-body text-[#1A1A18] placeholder:text-[#6B6560]/50 focus:outline-none focus:border-[#58bdae] focus:ring-2 focus:ring-[#58bdae]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-2 font-heading">Email</label>
                  <input type="email" placeholder="your@email.com" className="w-full px-4 py-3 bg-white rounded-xl border border-[#EDE8DF] text-sm font-body text-[#1A1A18] placeholder:text-[#6B6560]/50 focus:outline-none focus:border-[#58bdae] focus:ring-2 focus:ring-[#58bdae]/20 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-2 font-heading">Phone Number</label>
                  <input type="tel" placeholder="+91 XXXXX XXXXX" className="w-full px-4 py-3 bg-white rounded-xl border border-[#EDE8DF] text-sm font-body text-[#1A1A18] placeholder:text-[#6B6560]/50 focus:outline-none focus:border-[#58bdae] focus:ring-2 focus:ring-[#58bdae]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-2 font-heading">Preferred Destination</label>
                  <select className="w-full px-4 py-3 bg-white rounded-xl border border-[#EDE8DF] text-sm font-body text-[#1A1A18] focus:outline-none focus:border-[#58bdae] focus:ring-2 focus:ring-[#58bdae]/20 transition-all">
                    <option value="">Select a state</option>
                    {activeStates.map((s) => (
                      <option key={s.slug} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-2 font-heading">Travel Dates</label>
                  <input type="date" className="w-full px-4 py-3 bg-white rounded-xl border border-[#EDE8DF] text-sm font-body text-[#1A1A18] focus:outline-none focus:border-[#58bdae] focus:ring-2 focus:ring-[#58bdae]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-2 font-heading">No. of Travellers</label>
                  <input type="number" placeholder="2" min="1" className="w-full px-4 py-3 bg-white rounded-xl border border-[#EDE8DF] text-sm font-body text-[#1A1A18] placeholder:text-[#6B6560]/50 focus:outline-none focus:border-[#58bdae] focus:ring-2 focus:ring-[#58bdae]/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A18] mb-2 font-heading">Budget (per person)</label>
                  <select className="w-full px-4 py-3 bg-white rounded-xl border border-[#EDE8DF] text-sm font-body text-[#1A1A18] focus:outline-none focus:border-[#58bdae] focus:ring-2 focus:ring-[#58bdae]/20 transition-all">
                    <option value="">Select budget</option>
                    <option value="under-5k">Under ₹5,000</option>
                    <option value="5k-10k">₹5,000 – ₹10,000</option>
                    <option value="10k-25k">₹10,000 – ₹25,000</option>
                    <option value="25k-50k">₹25,000 – ₹50,000</option>
                    <option value="50k+">₹50,000+</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A18] mb-2 font-heading">Tell Us About Your Dream Trip</label>
                <textarea rows={4} placeholder="What kind of experience are you looking for? Any specific activities, interests, or requirements..." className="w-full px-4 py-3 bg-white rounded-xl border border-[#EDE8DF] text-sm font-body text-[#1A1A18] placeholder:text-[#6B6560]/50 focus:outline-none focus:border-[#58bdae] focus:ring-2 focus:ring-[#58bdae]/20 transition-all resize-none" />
              </div>
              <button
                type="button"
                className="w-full bg-[#FF7F50] text-white font-bold py-4 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] font-heading text-base tracking-wide"
              >
                Submit Custom Trip Request →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY CUSTOM TRIP ═══════════════ */}
      <section className="py-14 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold text-[#1A1A18]">
              Why Book a <span className="text-[#58bdae]">Custom Trip</span>?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              'Personalized itinerary crafted just for you',
              'Hand-picked verified local guide matched to your interests',
              'Flexible dates and group sizes',
              'Off-the-beaten-path experiences you won\'t find elsewhere',
              'Transparent pricing with no hidden fees',
              'Full support from our team before, during, and after your trip',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 bg-white rounded-xl p-5 border border-[#EDE8DF]">
                <CheckCircle2 className="w-5 h-5 text-[#58bdae] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#1A1A18] font-body font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ EXPLORE STATES CTA ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-gradient-to-r from-[#58bdae] to-[#4aa99b]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-[clamp(28px,4vw,44px)] font-bold text-white mb-4">
            Not Sure Where to Go?
          </h2>
          <p className="text-white/80 font-body text-lg mb-8 max-w-xl mx-auto">
            Browse our state guides to discover destinations and get inspired for your custom trip.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/explore"
              className="bg-white text-[#1A1A18] font-bold px-8 py-3.5 rounded-full hover:bg-[#F5F0E8] transition-colors font-heading text-sm"
            >
              Explore All States
            </Link>
            <Link
              href="/search"
              className="border-2 border-white text-white font-bold px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors font-heading text-sm"
            >
              Browse Experiences
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
