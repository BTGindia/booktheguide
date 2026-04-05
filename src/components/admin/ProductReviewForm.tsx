'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import toast from 'react-hot-toast';

interface Props {
  productId: string;
  currentStatus: string;
}

export function ProductReviewForm({ productId, currentStatus }: Props) {
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED') => {
    if (action === 'CHANGES_REQUESTED' && !reviewNotes.trim()) {
      toast.error('Please describe the changes required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          reviewNotes,
        }),
      });

      if (res.ok) {
        const messages: Record<string, string> = {
          APPROVED: 'Product approved!',
          REJECTED: 'Product rejected.',
          CHANGES_REQUESTED: 'Changes requested — guide will be notified.',
        };
        toast.success(messages[action]);
        router.push('/dashboard/admin/products');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Commission is now set when approving fixed departures, not at product level.
      </p>

      <Textarea
        id="reviewNotes"
        label="Review Notes (visible to guide)"
        value={reviewNotes}
        onChange={(e) => setReviewNotes(e.target.value)}
        placeholder="Any feedback for the guide..."
      />

      <div className="flex gap-3 pt-2 flex-wrap">
        <Button
          onClick={() => handleAction('APPROVED')}
          isLoading={loading}
          className="flex-1 min-w-[140px]"
        >
          ✅ Approve Product
        </Button>
        <Button
          onClick={() => handleAction('CHANGES_REQUESTED')}
          variant="outline"
          isLoading={loading}
          className="flex-1 min-w-[140px]"
        >
          ✏️ Request Changes
        </Button>
        <Button
          onClick={() => handleAction('REJECTED')}
          variant="danger"
          isLoading={loading}
          className="flex-1 min-w-[140px]"
        >
          ❌ Reject Product
        </Button>
      </div>
    </div>
  );
}
