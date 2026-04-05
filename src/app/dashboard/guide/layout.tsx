'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, Calendar, MapPin, Star, User,
  Settings, PlusCircle, ClipboardList, Menu, X, CalendarDays,
} from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard/guide', icon: LayoutDashboard },
  { label: 'Edit Profile', href: '/dashboard/guide/profile', icon: User },
  { label: 'My Packages', href: '/dashboard/guide/products', icon: Package },
  { label: 'Create Package', href: '/dashboard/guide/products/new', icon: PlusCircle },
  { label: 'Fixed Departures', href: '/dashboard/guide/departures', icon: CalendarDays },
  { label: 'Bookings', href: '/dashboard/guide/bookings', icon: ClipboardList },
  { label: 'Availability', href: '/dashboard/guide/availability', icon: Calendar },
  { label: 'Reviews', href: '/dashboard/guide/reviews', icon: Star },
];

export default function GuideDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50 pt-20">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-100 min-h-[calc(100vh-80px)] sticky top-20">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold font-heading text-btg-dark">Guide Dashboard</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage your profile & trips</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
                || (item.href !== '/dashboard/guide' && pathname.startsWith(item.href))
                || (item.href === '/dashboard/guide/products' && pathname.startsWith('/dashboard/guide/products'));
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
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile menu button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-12 h-12 bg-btg-terracotta text-white rounded-full shadow-xl flex items-center justify-center"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <>
            <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold font-heading text-btg-dark">Guide Dashboard</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage your profile & trips</p>
              </div>
              <nav className="p-4 space-y-1">
                {sidebarItems.map((item) => {
                  const isActive = pathname === item.href
                    || (item.href !== '/dashboard/guide' && pathname.startsWith(item.href))
                    || (item.href === '/dashboard/guide/products' && pathname.startsWith('/dashboard/guide/products'));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-btg-cream text-btg-terracotta'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
