'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, Send, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LineItem {
  label: string;
  amount: number;
  description: string;
}

interface Props {
  bookingId: string;
  booking: any;
  onQuoteSent?: () => void;
}

const SUGGESTED_ITEMS = [
  { label: 'Guide Fee', description: 'Professional guiding services' },
  { label: 'Meals', description: 'Breakfast, lunch, dinner' },
  { label: 'Transport', description: 'Local travel and transfers' },
  { label: 'Accommodation', description: 'Hotel / Homestay / Camping' },
  { label: 'Equipment', description: 'Trekking gear, tents, etc.' },
  { label: 'Permits & Fees', description: 'Entry fees, forest permits' },
  { label: 'Porter / Mule', description: 'Porter or mule for luggage' },
];

export default function GuideQuoteBuilder({ bookingId, booking, onQuoteSent }: Props) {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { label: 'Guide Fee', amount: 0, description: 'Professional guiding services' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addItem = (suggested?: { label: string; description: string }) => {
    setLineItems([
      ...lineItems,
      {
        label: suggested?.label || '',
        amount: 0,
        description: suggested?.description || '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const guests = booking.numberOfGuests || 1;
  const totalPerGuest = totalAmount;
  const grandTotal = totalPerGuest * guests;

  const handleSubmit = async () => {
    if (lineItems.length === 0) {
      toast.error('Add at least one line item');
      return;
    }

    const validItems = lineItems.filter((item) => item.label.trim() && item.amount > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one item with a label and amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/guide/bookings/${bookingId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageDetails: validItems,
          totalAmount: grandTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Quote sent to customer!');
      onQuoteSent?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send quote');
    } finally {
      setSubmitting(false);
    }
  };

  // Show booking requirements
  const requirements = booking.requirements || {};

  return (
    <div className="space-y-6">
      {/* Customer Requirements Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Customer Requirements
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-blue-600">Guests:</span>
            <span className="ml-2 font-medium">{booking.numberOfGuests}</span>
          </div>
          {booking.destinationName && (
            <div>
              <span className="text-blue-600">Destination:</span>
              <span className="ml-2 font-medium">{booking.destinationName}</span>
            </div>
          )}
          {booking.meetingPoint && (
            <div>
              <span className="text-blue-600">Pickup:</span>
              <span className="ml-2 font-medium">{booking.meetingPoint}</span>
            </div>
          )}
          <div>
            <span className="text-blue-600">Needs:</span>
            <span className="ml-2 font-medium">
              {[
                requirements.food && '🍽️ Food',
                requirements.travel && '🚗 Travel',
                requirements.stay && '🏨 Stay',
                requirements.other && `📝 ${requirements.other}`,
              ]
                .filter(Boolean)
                .join(', ') || 'Guide only'}
            </span>
          </div>
        </div>
        {booking.specialRequests && (
          <p className="text-sm text-blue-700 mt-2 italic">Notes: {booking.specialRequests}</p>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Package Line Items (per person)</h3>
        <div className="space-y-3">
          {lineItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => updateItem(i, 'label', e.target.value)}
                  placeholder="Item name"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 text-sm"
                />
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  placeholder="Description"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 text-sm"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">₹</span>
                  <input
                    type="number"
                    value={item.amount || ''}
                    onChange={(e) => updateItem(i, 'amount', Number(e.target.value))}
                    placeholder="Amount"
                    min={0}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => removeItem(i)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Quick Add Suggestions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED_ITEMS.filter(
            (s) => !lineItems.some((li) => li.label === s.label)
          ).map((s) => (
            <button
              key={s.label}
              onClick={() => addItem(s)}
              className="text-xs px-3 py-1.5 bg-btg-cream text-btg-terracotta rounded-full hover:bg-btg-sand transition-colors"
            >
              + {s.label}
            </button>
          ))}
          <button
            onClick={() => addItem()}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Custom
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Price Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Per person total</span>
            <span className="font-medium">{formatCurrency(totalPerGuest)}</span>
          </div>
          {guests > 1 && (
            <div className="flex justify-between">
              <span className="text-gray-600">× {guests} guests</span>
              <span className="font-medium">{formatCurrency(grandTotal)}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
            <span>Grand Total</span>
            <span className="text-btg-terracotta">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || grandTotal <= 0}
        className="w-full flex items-center justify-center gap-2 py-4 bg-btg-terracotta text-white rounded-xl text-lg font-semibold hover:bg-btg-terracotta disabled:opacity-50 transition-colors"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Quote to Customer
          </>
        )}
      </button>
    </div>
  );
}
