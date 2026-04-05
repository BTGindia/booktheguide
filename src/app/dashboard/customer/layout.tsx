'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  Home, ClipboardList, Star, User, Heart,
} from 'lucide-react';

const sidebarItems = [
  { label: 'Welcome', href: '/dashboard/customer', icon: Home, isWelcome: true },
  { label: 'My Bookings', href: '/dashboard/customer/bookings', icon: ClipboardList },
  { label: 'Reviews', href: '/dashboard/customer/reviews', icon: Star },
  { label: 'Your Wishlist', href: '/dashboard/customer/wishlist', icon: Heart },
  { label: 'Profile', href: '/dashboard/customer/profile', icon: User },
];

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-gray-50/50 pt-20">
      <div className="flex">
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-100 min-h-[calc(100vh-80px)] sticky top-20">
          <div className="p-6 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#58bdae] to-[#4aa99b] flex items-center justify-center mb-2">
              <span className="text-white text-sm font-bold">{userName[0]?.toUpperCase()}</span>
            </div>
            <h2 className="font-bold font-heading text-btg-dark">My Account</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage your bookings & profile</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = item.isWelcome
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const displayLabel = item.isWelcome ? `Welcome, ${userName}` : item.label;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-btg-cream text-btg-terracotta'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {displayLabel}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
