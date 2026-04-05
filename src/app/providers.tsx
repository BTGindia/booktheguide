'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Suspense } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1b3b20',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />
    </SessionProvider>
  );
}
