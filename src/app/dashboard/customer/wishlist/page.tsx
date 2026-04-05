'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';

export default function DashboardWishlistPage() {
  const { data: session } = useSession();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Your Wishlist</h1>
        <p className="text-gray-600 mt-1">Trips and experiences you&apos;ve saved for later</p>
      </div>

      {/* Empty wishlist state */}
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-[#58bdae]/10 flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-[#58bdae]" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-btg-dark mb-3">Your Wishlist is Empty</h2>
        <p className="text-gray-500 font-body mb-8 max-w-md mx-auto">
          Save your favourite trips and experiences to plan your perfect adventure. Browse our collection and tap the bookmark icon to add items here.
        </p>
        <Link
          href="/search"
          className="inline-block text-sm font-bold text-white bg-[#58bdae] px-8 py-3.5 rounded-full hover:bg-[#4aa99b] transition-all tracking-wide font-heading"
        >
          Explore Experiences
        </Link>
      </div>
    </div>
  );
}
