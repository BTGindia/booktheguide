'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Home,
  MapPin,
  Users,
  Compass,
  Mountain,
  FileText,
  HelpCircle,
  Globe,
  PenTool,
} from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', href: '/dashboard/ui-manager', icon: LayoutDashboard },
  { label: 'Homepage', href: '/dashboard/ui-manager/homepage', icon: Home },
  { label: 'Group Trips', href: '/dashboard/ui-manager/group-trips', icon: Users },
  { label: 'Destinations', href: '/dashboard/ui-manager/destinations', icon: MapPin },
  { label: 'State Pages', href: '/dashboard/ui-manager/states', icon: Mountain },
  { label: 'Experiences', href: '/dashboard/ui-manager/experiences', icon: Compass },
  { label: 'Blogs & Content', href: '/dashboard/ui-manager/blogs', icon: PenTool },
  { label: 'FAQs', href: '/dashboard/ui-manager/faqs', icon: HelpCircle },
  { label: 'SEO Content', href: '/dashboard/ui-manager/seo-content', icon: Globe },
  { label: 'All Pages', href: '/dashboard/ui-manager/pages', icon: FileText },
];

export default function UIManagerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50/50 pt-20">
      <div className="flex">
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-100 min-h-[calc(100vh-80px)] sticky top-20">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold font-heading text-btg-dark">UI Manager</h2>
            <p className="text-xs text-gray-500 mt-0.5">Control page display &amp; ordering</p>
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
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
