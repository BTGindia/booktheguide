'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Compass, Heart, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/search', label: 'Search', Icon: Search },
  { href: '/explore', label: 'Explore', Icon: Compass },
  { href: '/wishlist', label: 'Wishlist', Icon: Heart },
  { href: '/login', label: 'Account', Icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on dashboard pages
  if (pathname.startsWith('/dashboard')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200/80 pb-safe">
      <div className="flex items-center justify-around h-[64px] px-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] rounded-xl transition-colors ${
                isActive
                  ? 'text-[#58bdae]'
                  : 'text-[#6B6560] active:text-[#58bdae]'
              }`}
            >
              <Icon
                className={`w-[22px] h-[22px] transition-all ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`}
              />
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'font-bold' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
