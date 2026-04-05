import Link from 'next/link';
import { CATEGORIES_ORDERED } from '@/lib/categories';
import { getActiveCategories, getActiveStates } from '@/lib/active-packages';

export async function Footer() {
  // Fetch active categories and states from Super Admin dashboard
  const [activeDbCategories, activeStates] = await Promise.all([
    getActiveCategories().catch(() => []),
    getActiveStates().catch(() => []),
  ]);

  // Build experience links — only show categories enabled in Super Admin
  const activeSlugs = new Set(activeDbCategories.map((c: any) => c.slug || c.packageCategory));
  const experienceLinks = (activeSlugs.size > 0
    ? CATEGORIES_ORDERED.filter(cat => activeSlugs.has(cat.slug))
    : CATEGORIES_ORDERED
  ).map(cat => ({ label: cat.label, href: cat.href }));

  // Build state links — only show states enabled in Super Admin
  const stateLinks = activeStates.map(st => ({ label: st.name, href: `/explore/${st.slug}` }));

  return (
    <footer className="bg-[#1A1A18]">
      {/* Main Footer Content */}
      <div className="px-6 md:px-12 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-12 mb-14">
          {/* Brand Column */}
          <div>
            <div className="mb-4">
              <img src="/images/btg-logo.png" alt="Book The Guide" className="h-10 object-contain" />
            </div>
            <p className="text-[14px] leading-[1.8] text-white/60 mb-7 max-w-[280px] font-body">
              India&apos;s premier platform to book authentic guided travel experiences — from heritage walks to high-altitude adventures.
            </p>
            <div className="flex gap-3.5">
              {/* Instagram */}
              <a href="https://instagram.com/booktheguide" target="_blank" rel="noopener noreferrer" title="Instagram"
                className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center hover:scale-110 hover:shadow-[0_4px_20px_rgba(225,48,108,0.4)] transition-all">
                <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              {/* YouTube */}
              <a href="https://youtube.com/@booktheguide" target="_blank" rel="noopener noreferrer" title="YouTube"
                className="w-11 h-11 rounded-full bg-[#FF0000] flex items-center justify-center hover:scale-110 hover:shadow-[0_4px_20px_rgba(255,0,0,0.3)] transition-all">
                <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              {/* X (Twitter) */}
              <a href="https://x.com/booktheguide" target="_blank" rel="noopener noreferrer" title="X (Twitter)"
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:scale-110 hover:bg-white/20 transition-all">
                <svg className="w-[16px] h-[16px] text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              {/* LinkedIn */}
              <a href="https://linkedin.com/company/booktheguide" target="_blank" rel="noopener noreferrer" title="LinkedIn"
                className="w-11 h-11 rounded-full bg-[#0A66C2] flex items-center justify-center hover:scale-110 hover:shadow-[0_4px_20px_rgba(10,102,194,0.3)] transition-all">
                <svg className="w-[16px] h-[16px] text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              {/* Facebook */}
              <a href="https://facebook.com/booktheguide" target="_blank" rel="noopener noreferrer" title="Facebook"
                className="w-11 h-11 rounded-full bg-[#1877F2] flex items-center justify-center hover:scale-110 hover:shadow-[0_4px_20px_rgba(24,119,242,0.3)] transition-all">
                <svg className="w-[16px] h-[16px] text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>

          {/* Experiences */}
          <div>
            <h5 className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#58bdae] mb-5 font-heading">
              Experiences
            </h5>
            <ul className="space-y-3 list-none">
              {experienceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[14px] text-white/65 hover:text-[#58bdae] transition-colors font-body">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore States */}
          <div>
            <h5 className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#58bdae] mb-5 font-heading">
              Explore States
            </h5>
            <ul className="space-y-3 list-none">
              {stateLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[14px] text-white/65 hover:text-[#58bdae] transition-colors font-body">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/explore" className="text-[14px] text-white/65 hover:text-[#58bdae] transition-colors font-body">
                  All States
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h5 className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#58bdae] mb-5 font-heading">
              Company
            </h5>
            <ul className="space-y-3 list-none">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'Register as a Guide', href: '/register?role=guide' },
                { label: 'Blog', href: '/blog' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[14px] text-white/65 hover:text-[#58bdae] transition-colors font-body">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.08] px-6 md:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[13px] text-white/45 font-body">
          &copy; 2026 Book The Guide. All rights reserved.
        </p>
        <div className="flex gap-3">
          <span className="text-[12px] text-white/50 bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            SSL Secured
          </span>
          <span className="text-[12px] text-white/50 bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/></svg>
            Razorpay Trusted
          </span>
        </div>
      </div>
    </footer>
  );
}
