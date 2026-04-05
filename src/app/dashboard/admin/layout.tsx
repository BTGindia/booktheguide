'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Package, MapPin, CheckCircle, 
  ClipboardList, Settings, BarChart3, UserCog, CalendarCheck, Building2,
  ShieldCheck, Award, Wallet, FileText,
} from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Guides', href: '/dashboard/admin/guides', icon: Users },
  { label: 'Verify Guides', href: '/dashboard/admin/verify-guides', icon: ShieldCheck },
  { label: 'Certifications', href: '/dashboard/admin/certifications', icon: Award },
  { label: 'KYC Review', href: '/dashboard/admin/kyc', icon: Wallet },
  { label: 'Review Products', href: '/dashboard/admin/products', icon: CheckCircle },
  { label: 'Departure Approvals', href: '/dashboard/admin/departures', icon: CalendarCheck },
  { label: 'Destinations', href: '/dashboard/admin/destinations', icon: MapPin },
  { label: 'Regions', href: '/dashboard/admin/regions', icon: MapPin },
  { label: 'Corporate Inquiries', href: '/dashboard/admin/corporate-inquiries', icon: Building2 },
  { label: 'Bookings', href: '/dashboard/admin/bookings', icon: ClipboardList },
  { label: 'Audit Log', href: '/dashboard/admin/audit-log', icon: FileText },
  { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50/50 pt-20">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-100 min-h-[calc(100vh-80px)] sticky top-20">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold font-heading text-btg-dark">Admin Panel</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage guides & products</p>
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
