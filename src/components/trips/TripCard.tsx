import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateRange, getRemainingSeats } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { Calendar, Users, MapPin, Clock, ArrowRight } from 'lucide-react';

interface TripCardProps {
  trip: {
    id: string;
    startDate: string;
    endDate: string;
    totalSeats: number;
    bookedSeats: number;
    pricePerPerson: number;
    product: {
      title: string;
      slug: string;
      activityType: string;
      difficultyLevel: string;
      durationDays: number;
      coverImage: string | null;
      destination: {
        name: string;
        city?: { state?: { name: string } };
      };
    };
    guide: {
      slug: string;
      user: { name: string };
      averageRating: number;
      totalReviews: number;
    };
  };
}

export function TripCard({ trip }: TripCardProps) {
  const remaining = getRemainingSeats(trip.totalSeats, trip.bookedSeats);
  const isFull = remaining === 0;

  return (
    <Card hover className="h-full">
      {/* Cover */}
      <div className="relative h-44 bg-gradient-to-br from-btg-blush/30 to-btg-sand overflow-hidden">
        {trip.product.coverImage && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${trip.product.coverImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-card-gradient" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="info" size="sm">
            {trip.product.activityType.replace('_', ' ')}
          </Badge>
          <Badge
            variant={
              trip.product.difficultyLevel === 'EASY'
                ? 'success'
                : trip.product.difficultyLevel === 'MODERATE'
                ? 'warning'
                : 'danger'
            }
            size="sm"
          >
            {trip.product.difficultyLevel}
          </Badge>
        </div>

        {/* Seats indicator */}
        <div className="absolute top-3 right-3">
          <Badge variant={isFull ? 'danger' : remaining <= 3 ? 'warning' : 'success'} size="sm">
            {isFull ? 'Full' : `${remaining} seats left`}
          </Badge>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-base font-bold text-white font-heading line-clamp-2">
            {trip.product.title}
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Destination */}
        <div className="flex items-center gap-1.5 text-sm text-btg-mid">
          <MapPin className="w-3.5 h-3.5 text-btg-terracotta" />
          <span>
            {trip.product.destination.name}, {trip.product.destination.city?.state?.name || ''}
          </span>
        </div>

        {/* Dates & Duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-btg-mid">
            <Calendar className="w-3.5 h-3.5 text-btg-terracotta" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{trip.product.durationDays}D</span>
          </div>
        </div>

        {/* Guide Info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Guide</p>
            <Link
              href={`/guides/${trip.guide.slug}`}
              className="text-sm font-semibold text-btg-terracotta hover:underline"
            >
              {trip.guide.user.name}
            </Link>
          </div>
          <StarRating rating={trip.guide.averageRating} size="sm" showValue={false} />
        </div>

        {/* Group Size */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users className="w-3.5 h-3.5" />
          <span>
            {trip.bookedSeats}/{trip.totalSeats} joined
          </span>
        </div>
      </div>

      {/* Price Footer */}
      <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Per person</p>
          <p className="text-lg font-heading font-medium text-btg-dark">
            {formatCurrency(trip.pricePerPerson)}
          </p>
        </div>
        {!isFull && (
          <Link
            href={`/book/fixed/${trip.id}`}
            className="text-sm font-medium text-white bg-btg-terracotta hover:bg-btg-rust px-4 py-2 rounded-full flex items-center gap-1 transition-colors"
          >
            Join Trip
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </Card>
  );
}
