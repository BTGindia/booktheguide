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
    if ((action === 'CHANGES_REQUESTED' || action === 'APPROVED' || action === 'REJECTED') && !reviewNotes.trim()) {
      toast.error('Review notes are required. This message will be sent to the guide.');
      return;
    }

    if (action === 'APPROVED' || action === 'REJECTED') {
      const actionText = action === 'APPROVED' ? 'approve' : 'reject';
      const confirmed = window.confirm(
        `Are you sure you want to ${actionText} this package? The review note will be sent to the guide on WhatsApp and email.`
      );
      if (!confirmed) return;
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
        const data = await res.json();
        const messages: Record<string, string> = {
          APPROVED: 'Product approved!',
          REJECTED: 'Product rejected.',
          CHANGES_REQUESTED: 'Changes requested — guide will be notified.',
        };
        toast.success(messages[action]);

        if (data?.notification) {
          const emailFailed = data.notification.email?.attempted && !data.notification.email?.sent;
          const whatsappFailed = data.notification.whatsapp?.attempted && !data.notification.whatsapp?.sent;
          if (emailFailed || whatsappFailed) {
            toast.error('Status updated, but one or more notifications failed. Check webhook configuration.');
          }
        }

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
        label="Review Notes (sent to guide via WhatsApp & email)"
        value={reviewNotes}
        onChange={(e) => setReviewNotes(e.target.value)}
        placeholder="Type the exact message the guide should receive..."
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
