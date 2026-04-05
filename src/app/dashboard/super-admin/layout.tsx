'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, MapPin, CheckCircle, Package,
  ClipboardList, Settings, BarChart3, UserPlus, CalendarCheck, Shield,
  DollarSign, TrendingUp, Globe, Sparkles, Building2, BrainCircuit,
  Layers, Home, Star,
} from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard/super-admin', icon: LayoutDashboard },
  { label: 'Categories', href: '/dashboard/super-admin/categories', icon: Layers },
  { label: 'Manage Admins', href: '/dashboard/super-admin/admins', icon: UserPlus },
  { label: 'Guides', href: '/dashboard/super-admin/guides', icon: Users },
  { label: 'Packages', href: '/dashboard/super-admin/packages', icon: Package },
  { label: 'Destinations', href: '/dashboard/super-admin/destinations', icon: Globe },
  { label: 'Commission', href: '/dashboard/super-admin/commission', icon: DollarSign },
  { label: 'Homepage Control', href: '/dashboard/super-admin/homepage', icon: Home },
  { label: 'Sponsored Items', href: '/dashboard/super-admin/sponsored', icon: Star },
  { label: 'Best Sellers', href: '/dashboard/super-admin/best-sellers', icon: TrendingUp },
  { label: 'Inspiration', href: '/dashboard/super-admin/inspiration', icon: Sparkles },
  { label: 'Corporate Inquiries', href: '/dashboard/super-admin/corporate-inquiries', icon: Building2 },
  { label: 'Bookings', href: '/dashboard/super-admin/bookings', icon: ClipboardList },
  { label: 'Analytics', href: '/dashboard/super-admin/analytics', icon: BarChart3 },
  { label: 'AI Analytics', href: '/dashboard/super-admin/ai-analytics', icon: BrainCircuit },
];

export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50/50 pt-20">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-100 min-h-[calc(100vh-80px)] sticky top-20">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-btg-terracotta" />
              <h2 className="font-bold font-heading text-btg-dark">Super Admin</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Full platform management</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
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

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
