'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GuideAvailabilityPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, { isAvailable: boolean }>>({});
  const [bookedDates, setBookedDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  useEffect(() => {
    fetchAvailability();
  }, [currentMonth]);

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`/api/guide/availability?year=${year}&month=${month + 1}`);
      const data = await res.json();
      if (data.availability) {
        const map: Record<string, { isAvailable: boolean }> = {};
        data.availability.forEach((item: any) => {
          const dateStr = new Date(item.date).toISOString().split('T')[0];
          map[dateStr] = { isAvailable: item.isAvailable };
        });
        setAvailability(map);
      }
      if (data.bookedDates) {
        const bookedMap: Record<string, string> = {};
        data.bookedDates.forEach((item: any) => {
          bookedMap[item.date] = item.title;
        });
        setBookedDates(bookedMap);
      }
    } catch {
      // ignore
    }
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  const markAvailable = async () => {
    if (selectedDates.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/guide/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: selectedDates,
          isAvailable: true,
        }),
      });
      if (res.ok) {
        toast.success('Dates marked as available');
        setSelectedDates([]);
        fetchAvailability();
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const markUnavailable = async () => {
    if (selectedDates.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/guide/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: selectedDates,
          isAvailable: false,
        }),
      });
      if (res.ok) {
        toast.success('Dates marked as unavailable');
        setSelectedDates([]);
        fetchAvailability();
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Availability Calendar</h1>
        <p className="text-gray-600 mt-1">
          Mark your available dates. Travellers can book you on available dates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(new Date(year, month - 1))}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-btg-dark">
                  {monthNames[month]} {year}
                </h2>
                <button
                  onClick={() => setCurrentMonth(new Date(year, month + 1))}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month start */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-14" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isPast = dateStr < today;
                  const isSelected = selectedDates.includes(dateStr);
                  const avail = availability[dateStr];
                  const isAvailable = avail?.isAvailable;
                  const isBooked = !!bookedDates[dateStr];
                  const bookingTitle = bookedDates[dateStr];

                  return (
                    <button
                      key={day}
                      disabled={isPast || isBooked}
                      onClick={() => !isPast && !isBooked && toggleDate(dateStr)}
                      title={isBooked ? `Booked: ${bookingTitle}` : undefined}
                      className={`h-14 rounded-lg text-sm font-medium flex flex-col items-center justify-center gap-0.5 transition-all border ${
                        isPast
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-transparent'
                          : isBooked
                          ? 'bg-blue-50 text-blue-700 border-blue-200 cursor-not-allowed'
                          : isSelected
                          ? 'bg-btg-terracotta text-white border-btg-terracotta shadow-lg'
                          : isAvailable
                          ? 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
                          : avail && !isAvailable
                          ? 'bg-red-50 text-red-400 border-red-200'
                          : 'bg-white text-gray-700 border-gray-100 hover:border-btg-blush'
                      }`}
                    >
                      <span>{day}</span>
                      {isBooked && <span className="text-[8px]">📅</span>}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded bg-btg-terracotta" />
                  <span>Selected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-btg-dark">
                {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
              </h3>

              <Button
                onClick={markAvailable}
                isLoading={loading}
                className="w-full"
                disabled={selectedDates.length === 0}
              >
                Mark Available
              </Button>

              <Button
                onClick={markUnavailable}
                variant="danger"
                isLoading={loading}
                className="w-full"
                disabled={selectedDates.length === 0}
              >
                Mark Unavailable
              </Button>

              {/* Select All Dates in Current Month */}
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  const allDates: string[] = [];
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    if (dateStr >= today) allDates.push(dateStr);
                  }
                  setSelectedDates(allDates);
                }}
                className="w-full text-sm font-medium text-btg-terracotta bg-btg-cream hover:bg-btg-sand py-2 rounded-lg transition-colors"
              >
                Select All Dates
              </button>

              <button
                onClick={() => setSelectedDates([])}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Selection
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-btg-dark mb-2">Tips</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li>&bull; Click dates to select them, then mark available/unavailable</li>
                <li>&bull; Use &quot;Select All&quot; to quickly mark the entire month</li>
                <li>&bull; Dates with bookings cannot be modified</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
