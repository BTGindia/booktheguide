'use client';

import Link from 'next/link';
import { MapPin, Clock, Star, Mountain } from 'lucide-react';

/** Minimal shape every PackageCard needs. All pages pass data in this form. */
export interface PackageCardData {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  durationDays: number;
  durationNights: number;
  activityType: string;
  packageCategory: string;
  destinationName: string;
  stateName: string;
  guideName: string;
  guideRating: number;
  guideReviewCount: number;
  guideCertification?: string;
  meetingPoint?: string;
  /** Lowest price from the next departure, or null if personal-only */
  price: number | null;
  /** Optional label placed on the yellow badge */
  badgeLabel?: string;
  /** Seats remaining for the next departure */
  seatsLeft?: number;
  /** Whether this product is sponsored/recommended */
  isSponsored?: boolean;
}

export function PackageCard({ pkg }: { pkg: PackageCardData }) {
  return (
    <div className={`flex flex-col sm:flex-row items-stretch gap-5 bg-white rounded-[20px] overflow-hidden shadow-[0_2px_16px_rgba(28,26,23,0.06)] hover:shadow-[0_12px_40px_rgba(28,26,23,0.12)] hover:-translate-y-0.5 transition-all duration-300 relative ${pkg.isSponsored ? 'border-2 border-btg-dark ring-1 ring-btg-dark/10' : ''}`}>
      {/* Recommended badge */}
      {pkg.isSponsored && (
        <span className="absolute top-3 right-3 z-10 bg-btg-dark text-white text-[10px] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full shadow-md">
          Recommended
        </span>
      )}
      {/* ---- Image ---- */}
      <Link
        href={`/trips/${pkg.slug}`}
        className="flex-shrink-0 w-full sm:w-[240px] lg:w-[320px] h-[220px] sm:h-auto overflow-hidden relative"
      >
        {pkg.coverImage ? (
          <img
            src={pkg.coverImage}
            alt={pkg.title}
            className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-btg-terracotta/10 to-btg-sage/10">
            <Mountain className="w-12 h-12 text-btg-terracotta/40" />
          </div>
        )}
        {pkg.seatsLeft !== undefined && pkg.seatsLeft > 0 && (
          <span className="absolute top-3 left-3 bg-btg-terracotta text-white text-[10px] font-semibold tracking-[0.1em] px-3 py-1 rounded-full uppercase">
            {pkg.seatsLeft} seats left
          </span>
        )}
      </Link>

      {/* ---- Content ---- */}
      <div className="flex-1 flex flex-col justify-center p-5 sm:py-6 sm:pr-3 min-w-0">
        {/* Category tag */}
        <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-btg-terracotta mb-2">
          {pkg.activityType.replace(/_/g, ' ')}
        </div>

        {/* Title */}
        <Link href={`/trips/${pkg.slug}`}>
          <h3 className="font-heading text-xl lg:text-2xl font-medium text-btg-dark hover:text-btg-terracotta transition-colors line-clamp-2 mb-1.5">
            {pkg.title}
          </h3>
        </Link>

        {/* Guide name */}
        <p className="text-sm text-btg-mid font-medium mb-2">
          by {pkg.guideName}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <span className="text-xs text-btg-light-text flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {pkg.destinationName}, {pkg.stateName}
          </span>
          <span className="text-xs text-btg-light-text flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {pkg.durationDays}D{pkg.durationNights > 0 ? `/${pkg.durationNights}N` : ''}
          </span>
          <span className="text-xs text-btg-light-text flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-btg-gold text-btg-gold" /> {pkg.guideRating.toFixed(1)} ({pkg.guideReviewCount})
          </span>
          {pkg.guideCertification && (
            <span className="text-[10px] font-medium text-btg-teal bg-btg-teal/10 px-2 py-0.5 rounded-full">
              {pkg.guideCertification}
            </span>
          )}
        </div>

        {/* Meeting Point */}
        {pkg.meetingPoint && (
          <p className="text-xs text-btg-light-text mb-2">
            Meeting Point: {pkg.meetingPoint}
          </p>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="text-xl font-medium text-btg-dark">
            {pkg.price ? `\u20B9${pkg.price.toLocaleString('en-IN')}` : 'On Request'}
            <small className="text-[11px] text-btg-light-text font-light ml-1">/person</small>
          </div>
        </div>
      </div>

      {/* ---- Buttons ---- */}
      <div className="flex sm:flex-col items-center justify-center gap-3 flex-shrink-0 p-4 sm:pr-6">
        <Link
          href={`/trips/${pkg.slug}`}
          className="w-full sm:w-[140px] py-3 flex items-center justify-center bg-btg-terracotta text-white font-medium text-sm rounded-full hover:bg-btg-rust hover:-translate-y-0.5 transition-all text-center tracking-wide"
        >
          Book Now
        </Link>
        <Link
          href={`/trips/${pkg.slug}`}
          className="w-full sm:w-[140px] py-3 flex items-center justify-center bg-white border border-btg-dark/20 text-btg-dark font-medium text-sm rounded-full hover:border-btg-terracotta hover:text-btg-terracotta transition-all text-center tracking-wide"
        >
          Read More
        </Link>
      </div>
    </div>
  );
}
