'use client';

import Link from 'next/link';
import { Mountain } from 'lucide-react';

/** Shape every DestinationCard needs */
export interface DestinationCardData {
  id: string;
  name: string;
  coverImage: string | null;
  stateName: string;
  packageCount: number;
}

/**
 * BTG theme Destination card:
 * - Rounded card with hover lift
 * - Gradient overlay at bottom
 */
export function DestinationCard({ dest }: { dest: DestinationCardData }) {
  return (
    <Link
      href={`/destinations/${dest.id}`}
      className="group relative rounded-[20px] overflow-hidden aspect-[2/3] hover:-translate-y-1.5 transition-transform duration-300"
    >
      {dest.coverImage ? (
        <img
          src={dest.coverImage}
          alt={dest.name}
          className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-btg-terracotta/20 to-btg-sage/20 flex items-center justify-center">
          <Mountain className="w-10 h-10 text-btg-terracotta/40" />
        </div>
      )}

      {/* Hover tint */}
      <div className="absolute inset-0 bg-btg-terracotta/[0.15] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 pt-14 pb-5 px-5 bg-gradient-to-t from-[rgba(28,26,23,0.85)] to-transparent">
        <div className="font-heading text-[20px] font-normal text-white">{dest.name}</div>
        <div className="text-[11px] text-white/65 tracking-wider mt-0.5">
          {dest.stateName} &middot; {dest.packageCount} package{dest.packageCount !== 1 ? 's' : ''}
        </div>
      </div>
    </Link>
  );
}
