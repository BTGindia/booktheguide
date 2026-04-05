'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Heart,
  MapPin,
  Compass,
} from 'lucide-react';

interface NavCity { name: string; slug: string; packageCount: number; }
interface NavState { name: string; code: string; slug: string; cities: NavCity[]; }
interface NavActivity { name: string; slug: string; packageCount: number; }
interface NavExperience { name: string; slug: string; key: string; activities: NavActivity[]; }
interface NavCategory { slug: string; label: string; urlSlug: string; navLabel: string | null; navOrder: number; subCategories: { name: string; slug: string }[]; }
interface NavData { destinations: NavState[]; experiences: NavExperience[]; navCategories?: NavCategory[]; logoUrl?: string; }

// Fallback static data
const STATIC_DESTINATIONS = [
  { label: 'Uttarakhand', href: '/explore/uttarakhand' },
  { label: 'Himachal Pradesh', href: '/explore/himachal-pradesh' },
  { label: 'Ladakh', href: '/explore/ladakh' },
  { label: 'Kashmir', href: '/explore/kashmir' },
  { label: 'Delhi', href: '/explore/delhi' },
  { label: 'Rajasthan', href: '/explore/rajasthan' },
  { label: 'Uttar Pradesh', href: '/explore/uttar-pradesh' },
];

// Default nav categories (used when DB has none yet)
const DEFAULT_NAV_ITEMS = [
  { label: 'Trekking', href: '/experiences/trekking', hasDropdown: false },
  { label: 'Adventure Sports', href: '/experiences/adventure-guides', hasDropdown: false },
  { label: 'Offbeat Trips', href: '/experiences/offbeat-travel', hasDropdown: false },
  { label: 'Influencer Trips', href: '/experiences/travel-with-influencers', hasDropdown: false },
];

const INSPIRATION_ITEMS = [
  { label: 'Blog', href: '/blog' },
  { label: 'Itineraries', href: '/inspiration' },
  { label: 'Streaming Videos', href: '/inspiration?tab=videos' },
  { label: 'Gallery', href: '/inspiration?tab=gallery' },
];

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [hoveredSubcat, setHoveredSubcat] = useState<string | null>(null);
  const [navData, setNavData] = useState<NavData | null>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // Fetch dynamic navigation data
  useEffect(() => {
    fetch('/api/navigation')
      .then(r => r.json())
      .then(data => setNavData(data))
      .catch(() => {}); // Fall back to static
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setHoveredSubcat(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDashboardLink = () => {
    if (!session?.user) return '/login';
    const role = (session.user as any).role;
    switch (role) {
      case 'SUPER_ADMIN': return '/dashboard/super-admin';
      case 'ADMIN': return '/dashboard/admin';
      case 'GUIDE': return '/dashboard/guide';
      case 'CUSTOMER': return '/dashboard/customer';
      default: return '/dashboard/customer';
    }
  };

  // Build dynamic nav items from DB categories or fallback to defaults
  const dbNavCats = navData?.navCategories || [];
  const dynamicNavItems = dbNavCats.length > 0
    ? dbNavCats
        .sort((a, b) => a.navOrder - b.navOrder)
        .map((cat) => ({
          label: cat.navLabel || cat.label,
          href: `/experiences/${cat.urlSlug}`,
          hasDropdown: cat.subCategories.length > 0,
          subCategories: cat.subCategories,
          key: cat.slug,
        }))
    : DEFAULT_NAV_ITEMS.map((item) => ({ ...item, subCategories: [] as { name: string; slug: string }[], key: item.label }));

  const navItems = dynamicNavItems;

  const logoUrl = navData?.logoUrl || '';

  const openDropdownOnHover = (label: string) => {
    setOpenDropdown(label);
    setHoveredSubcat(null);
  };

  const closeDropdownOnLeave = () => {
    setOpenDropdown(null);
    setHoveredSubcat(null);
  };

  // Render mega menu dropdown based on type
  const renderDropdown = (label: string, item?: any) => {
    // Dynamic category dropdown (subcategories)
    if (item?.subCategories?.length > 0) {
      return (
        <div className="absolute top-full left-0 mt-0 pt-3" onMouseLeave={closeDropdownOnLeave}>
          <div className="w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden py-1">
            {item.subCategories.map((sub: { name: string; slug: string }) => (
              <Link
                key={sub.slug}
                href={`/search?category=${item.key}&activity=${encodeURIComponent(sub.name)}`}
                onClick={() => setOpenDropdown(null)}
                className="block px-4 py-2.5 text-[14px] text-[#1A1A18] hover:bg-[#EDE8DF] hover:text-[#58bdae] transition-colors font-body"
              >
                {sub.name}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <Link
                href={item.href}
                onClick={() => setOpenDropdown(null)}
                className="block px-4 py-2.5 text-[13px] font-semibold text-[#58bdae] hover:underline"
              >
                View all {label} →
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between transition-all duration-300 ${
        scrolled
          ? 'py-4 px-6 md:px-14 shadow-[0_4px_32px_rgba(0,0,0,0.25)]'
          : 'py-5 px-6 md:px-14'
      }`}
      style={{ background: '#1A1A18' }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center flex-shrink-0">
        <img src={logoUrl || '/images/btg-logo-cropped.png'} alt="Book The Guide" className="block h-12 md:h-14 self-center object-contain leading-none my-auto" />
      </Link>

      {/* Center Nav Links */}
      <ul ref={dropdownRef} className="hidden lg:flex items-center gap-6 list-none">
        {(!session?.user || (session.user as any).role === 'CUSTOMER') && (
          <>
            {navItems.map((item) => (
              <li key={item.label} className="relative">
                {item.hasDropdown ? (
                  <div onMouseEnter={() => openDropdownOnHover(item.label)}>
                    <button
                      className="text-[15px] font-semibold text-white/90 tracking-[0.04em] hover:text-[#58bdae] transition-colors flex items-center gap-1 font-body whitespace-nowrap leading-none"
                    >
                      {item.label}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === item.label && renderDropdown(item.label, item)}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="text-[15px] font-semibold text-white/90 tracking-[0.04em] hover:text-[#58bdae] transition-colors font-body whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            {/* Become a Guide — always visible */}
            <li>
              <Link
                href="/register?role=guide"
                className="text-[15px] font-bold text-[#FFD96A] tracking-[0.04em] border border-[#FFD96A]/40 px-4 py-1.5 rounded-full hover:bg-[#FFD96A] hover:text-[#1A1A18] transition-all duration-300 font-body whitespace-nowrap"
              >
                Become a Guide
              </Link>
            </li>
          </>
        )}
      </ul>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Wishlist */}
        <Link href="/wishlist" title="Wishlist" className="hidden sm:flex items-center justify-center text-white/70 hover:text-white transition-colors">
          <Heart className="w-[18px] h-[18px]" strokeWidth={1.5} />
        </Link>

        {session?.user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#58bdae] flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {session.user.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden sm:block text-[13px] font-medium text-white">
                {session.user.name?.split(' ')[0]}
              </span>
              <ChevronDown className="w-4 h-4 text-white/60" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-[#1A1A18]">{session.user.name}</p>
                    <p className="text-xs text-[#6B6560]">{session.user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#58bdae]/10 text-[#58bdae] uppercase">
                      {(session.user as any).role?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link href={getDashboardLink()} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B6560] hover:bg-[#EDE8DF] transition-colors">
                      <User className="w-4 h-4" /> My Account
                    </Link>
                    <button onClick={async () => { setUserMenuOpen(false); await signOut({ redirect: false }); router.push('/'); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center">
            <Link
              href="/login"
              className="flex items-center gap-2 text-[14px] font-bold text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-all tracking-[0.02em] font-heading"
              style={{ background: '#58bdae' }}
            >
              <User className="w-4 h-4" />
              Account
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 lg:hidden border-t border-white/10 py-4 bg-[#1A1A18] animate-slideIn">
          <div className="flex flex-col gap-1 px-6">
            {(!session?.user || (session.user as any).role === 'CUSTOMER') && (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-[14px] text-white/80 hover:text-[#58bdae] hover:bg-white/5 rounded-lg transition-colors font-body"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/register?role=guide"
                  onClick={() => setMobileOpen(false)}
                  className="mx-4 mt-2 px-4 py-3 text-[15px] font-bold text-[#FFD96A] border border-[#FFD96A]/40 rounded-full text-center hover:bg-[#FFD96A] hover:text-[#1A1A18] transition-all duration-300 font-body"
                >
                  Become a Guide
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-[14px] text-white/80 hover:text-[#58bdae] hover:bg-white/5 rounded-lg transition-colors font-body"
                >
                  Wishlist
                </Link>
              </>
            )}
            {!session?.user && (
              <div className="flex gap-3 px-4 pt-3 border-t border-white/10 mt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2.5 text-[13px] font-semibold text-white rounded-full font-heading" style={{ background: '#58bdae' }}>
                  Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
