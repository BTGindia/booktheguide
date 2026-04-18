import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import dynamic from 'next/dynamic';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import './globals.css';

// Lazy load the AI assistant — only loaded when user interacts
const AiTravelAssistant = dynamic(
  () => import('@/components/ai/AiTravelAssistant').then(m => m.AiTravelAssistant),
  { ssr: false }
);

export const metadata: Metadata = {
  metadataBase: new URL('https://www.booktheguide.com'),
  title: {
    default: 'Book The Guide - Your Adventure, Our Expertise | Book Local Guides for Treks & Tours in India',
    template: '%s | Book The Guide',
  },
  description:
    'Book verified local guides for treks, hill stations, city tours & adventure trips across India. Compare guides, read reviews, check availability & book online. Your trusted guide booking platform.',
  keywords: [
    'book guide India', 'trek guide booking', 'local guide India',
    'hill station guide', 'adventure guide', 'trekking guide Himachal',
    'trekking guide Uttarakhand', 'Kashmir guide', 'Ladakh guide',
    'city tour guide India', 'book tour guide online',
    'guide booking platform', 'personal guide India',
    'group trek India', 'fixed departure treks',
  ],
  authors: [{ name: 'Book The Guide' }],
  creator: 'Book The Guide',
  publisher: 'Book The Guide',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.booktheguide.com',
    siteName: 'Book The Guide',
    title: 'Book The Guide - Your Adventure, Our Expertise',
    description:
      'Book verified local guides for treks, hill stations, city tours & adventure trips across India.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Book The Guide - India\'s Guide Booking Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book The Guide - Your Adventure, Our Expertise',
    description:
      'Book verified local guides for treks, hill stations, city tours & adventure trips across India.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'https://www.booktheguide.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=ADLaM+Display&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&display=swap" as="style" />
        <link href="https://fonts.googleapis.com/css2?family=ADLaM+Display&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'TravelAgency',
              name: 'Book The Guide',
              description: 'India\'s premier guide booking platform for treks, tours, and adventures.',
              url: 'https://www.booktheguide.com',
              logo: 'https://www.booktheguide.com/images/btg-logo.webp',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'New Delhi',
                addressCountry: 'IN',
              },
              sameAs: [],
              priceRange: '₹₹',
              areaServed: {
                '@type': 'Country',
                name: 'India',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <div className="mobile-nav-spacer" />
          <MobileBottomNav />
          <AiTravelAssistant />
        </Providers>
      </body>
    </html>
  );
}
