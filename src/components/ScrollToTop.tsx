'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use layoutEffect so it runs before paint — prevents "flash at bottom"
  useIsomorphicLayoutEffect(() => {
    // Double-raf ensures the DOM has been updated and layout is settled
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0 });
      });
    });
  }, [pathname, searchParams]);

  return null;
}
