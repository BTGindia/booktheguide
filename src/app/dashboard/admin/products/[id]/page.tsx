import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ProductReviewForm } from '@/components/admin/ProductReviewForm';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ACTIVITY_LABELS, DIFFICULTY_LABELS } from '@/lib/utils';
import {
  MapPin, Users, Clock, Mountain, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: { id: string };
}

export default async function ReviewProductPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'STATE_ADMIN')) redirect('/login');

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      guide: {
        include: {
          user: { select: { name: true, email: true } },
          serviceAreas: { include: { state: { select: { name: true } } } },
        },
      },
      destination: {
        include: { city: { include: { state: { select: { name: true, id: true } } } } },
      },
      fixedDepartures: {
        take: 1,
        orderBy: { startDate: 'desc' },
        select: { minGroupSize: true, maxGroupSize: true, pricePerPerson: true },
      },
    },
  });

  if (!product) notFound();

  // If user is a state admin / admin with managed states, ensure they can access this product
  if (role === 'ADMIN' || role === 'STATE_ADMIN') {
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: (session?.user as any)?.id },
      include: { managedStates: true },
    });
    const stateId = product.destination?.city?.state?.id;
    if (adminProfile?.managedStates && adminProfile.managedStates.length > 0) {
      const allowed = adminProfile.managedStates.some((s) => s.id === stateId);
      if (!allowed) redirect('/');
    }
  }

  const rawItinerary = product.itinerary;
  // Itinerary can be either a JSON array of day objects or a plain text string
  const itineraryArray: any[] = Array.isArray(rawItinerary) ? rawItinerary : [];
  const itineraryText: string | null = typeof rawItinerary === 'string' ? rawItinerary : null;

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard/admin/products"
        className="inline-flex items-center gap-1 text-sm text-btg-terracotta hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold font-heading text-btg-dark">
            Review Product
          </h1>
          <Badge
            variant={
              product.status === 'APPROVED' ? 'success' :
              product.status === 'REJECTED' ? 'danger' :
              product.status === 'PENDING_REVIEW' ? 'warning' :
              product.status === 'CHANGES_REQUESTED' ? 'warning' : 'default'
            }
          >
            {product.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-btg-dark mb-2">{product.title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {product.destination.name}, {product.destination.city?.state?.name || ''}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {product.durationDays}D / {product.durationNights}N
              </div>
              {(product as any).fixedDepartures?.[0] && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {(product as any).fixedDepartures[0].minGroupSize}-{(product as any).fixedDepartures[0].maxGroupSize} persons
                </div>
              )}
            </div>
            <div className="flex gap-2 mb-4">
              <Badge variant="info">{ACTIVITY_LABELS[product.activityType] || (product.activityType === '__custom__' ? 'Custom' : product.activityType.replace(/_/g, ' '))}</Badge>
              <Badge variant={product.difficultyLevel === 'EASY' ? 'success' : product.difficultyLevel === 'MODERATE' ? 'warning' : 'danger'}>
                {DIFFICULTY_LABELS[product.difficultyLevel] || product.difficultyLevel}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 italic mb-4">
              Pricing is set per fixed departure
            </p>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </CardContent>
        </Card>

        {/* Guide Info */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-btg-dark mb-3">Guide Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-semibold">{product.guide.user.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <span className="ml-2">{product.guide.user.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <span className="ml-2">
                  {product.guide.serviceAreas?.[0]?.state?.name || 'India'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itinerary */}
        {(itineraryArray.length > 0 || itineraryText) && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-btg-dark mb-4">Itinerary</h3>
              {itineraryArray.length > 0 ? (
                <div className="space-y-4">
                  {itineraryArray.map((day: any, i: number) => (
                    <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-btg-terracotta text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                        D{day.day || i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{day.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{day.description}</p>
                        {day.meals && <p className="text-xs text-gray-500 mt-1">Meals: {day.meals}</p>}
                        {day.accommodation && <p className="text-xs text-gray-500">Stay: {day.accommodation}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{itineraryText}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Inclusions / Exclusions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-green-700 mb-3">Inclusions</h3>
              <ul className="space-y-1.5">
                {product.inclusions.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700">&bull; {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-red-700 mb-3">Exclusions</h3>
              <ul className="space-y-1.5">
                {product.exclusions.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700">&bull; {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Form */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-btg-dark mb-4">Review Action</h3>
          <ProductReviewForm productId={product.id} currentStatus={product.status} />
        </CardContent>
      </Card>
    </div>
  );
}
