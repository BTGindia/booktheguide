import Link from 'next/link';
import Image from 'next/image';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  MapPin,
  Languages,
  Mountain,
  Shield,
  Calendar,
} from 'lucide-react';

interface GuideCardProps {
  guide: {
    id: string;
    slug: string;
    user: { name: string; image: string | null };
    tagline: string | null;
    experienceYears: number;
    totalTrips: number;
    averageRating: number;
    totalReviews: number;
    languages: string[];
    specializations: string[];
    isVerified: boolean;
    coverImage: string | null;
    portfolioImages: string[];
    serviceAreas?: { state: { name: string } }[];
  };
}

export function GuideCard({ guide }: GuideCardProps) {
  const coverImg = guide.coverImage || guide.portfolioImages?.[0] || guide.user.image || '/images/default-guide.jpg';

  // Derive location from serviceAreas
  const locationParts: string[] = [];
  if (guide.serviceAreas && guide.serviceAreas.length > 0) {
    const firstArea = guide.serviceAreas[0];
    locationParts.push(firstArea.state.name);
  }
  const locationStr = locationParts.join(', ') || 'India';

  return (
    <Link href={`/guides/${guide.slug}`}>
      <Card hover className="h-full">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-btg-blush/30 to-btg-sand overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${coverImg})` }}
          />
          <div className="absolute inset-0 bg-card-gradient" />

          {/* Verified Badge */}
          {guide.isVerified && (
            <div className="absolute top-3 right-3">
              <div className="badge-verified text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Shield className="w-3 h-3" />
                Verified
              </div>
            </div>
          )}

          {/* Guide Name on Image */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-bold text-white font-heading truncate">
              {guide.user.name}
            </h3>
            {guide.tagline && (
              <p className="text-xs text-white/80 truncate">{guide.tagline}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-btg-mid">
            <MapPin className="w-3.5 h-3.5 text-btg-terracotta" />
            <span>{locationStr}</span>
          </div>

          {/* Rating */}
          <StarRating
            rating={guide.averageRating}
            totalReviews={guide.totalReviews}
            size="sm"
          />

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Mountain className="w-3.5 h-3.5" />
              <span>{guide.totalTrips} trips</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{guide.experienceYears} yrs exp</span>
            </div>
          </div>

          {/* Languages */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Languages className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{guide.languages.join(', ')}</span>
          </div>

          {/* Specializations */}
          <div className="flex flex-wrap gap-1.5">
            {guide.specializations.slice(0, 3).map((spec) => (
              <Badge key={spec} variant="outline" size="sm">
                {spec}
              </Badge>
            ))}
            {guide.specializations.length > 3 && (
              <Badge variant="default" size="sm">
                +{guide.specializations.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {guide.user.image && (
              <Image src={guide.user.image} alt={guide.user.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-btg-sand" />
            )}
            <div>
              <p className="text-xs text-btg-light-text">{guide.experienceYears} yrs experience</p>
              <p className="text-xs text-btg-light-text">{guide.totalTrips} trips done</p>
            </div>
          </div>
          <span className="text-sm font-medium text-btg-terracotta bg-btg-blush/20 px-4 py-2 rounded-full">
            View Profile →
          </span>
        </div>
      </Card>
    </Link>
  );
}
