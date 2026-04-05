import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import FixedDepartureBookingForm from '@/components/booking/FixedDepartureBookingForm';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const departure = await prisma.fixedDeparture.findUnique({
    where: { id: params.id },
    include: {
      product: {
        include: {
          destination: { include: { city: { include: { state: true } } } },
          guide: { include: { user: { select: { name: true } } } },
        },
      },
    },
  });

  if (!departure) return { title: 'Trip Not Found | Book The Guide' };

  return {
    title: `Book ${departure.product.title} | Book The Guide`,
    description: `Join ${departure.product.title} with ${departure.product.guide.user.name}. ${departure.totalSeats - departure.bookedSeats} seats remaining.`,
  };
}

export default async function BookFixedDeparturePage({ params }: Props) {
  const departure = await prisma.fixedDeparture.findUnique({
    where: { id: params.id, isActive: true },
    include: {
      product: {
        include: {
          destination: { include: { city: { include: { state: true } } } },
          guide: {
            include: {
              user: { select: { name: true, image: true } },
            },
          },
        },
      },
    },
  });

  if (!departure) notFound();

  const remaining = departure.totalSeats - departure.bookedSeats;
  if (remaining <= 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip is Full</h1>
          <p className="text-gray-600">This departure has no more seats available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
      <p className="text-gray-600 mb-8">You&apos;re joining a fixed departure trip</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <FixedDepartureBookingForm
            departure={JSON.parse(JSON.stringify(departure))}
            remaining={remaining}
          />
        </div>

        {/* Trip Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Trip Summary</h3>

            {departure.product.coverImage && (
              <img
                src={departure.product.coverImage}
                alt={departure.product.title}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}

            <h4 className="font-medium text-gray-900">{departure.product.title}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {departure.product.destination.name} •{' '}
              {departure.product.destination.city.state.name}
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Guide</span>
                <span className="font-medium">{departure.product.guide.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dates</span>
                <span className="font-medium">
                  {new Date(departure.startDate).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short',
                  })} - {new Date(departure.endDate).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">
                  {departure.product.durationDays}D / {departure.product.durationNights}N
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seats Left</span>
                <span className="font-medium text-btg-terracotta">{remaining}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Meeting Point</span>
                <span className="font-medium">{departure.meetingPoint || 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Meeting Time</span>
                <span className="font-medium">{departure.meetingTime}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Per Person</span>
                <span className="text-btg-terracotta">
                  ₹{departure.pricePerPerson.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
