type ReviewDecision = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

interface GuideReviewNotificationInput {
  guideName: string | null;
  guideEmail: string | null;
  guidePhone: string | null;
  productTitle: string;
  decision: ReviewDecision;
  reviewNote: string;
}

interface ChannelResult {
  attempted: boolean;
  sent: boolean;
  reason?: string;
}

export interface ReviewNotificationResult {
  email: ChannelResult;
  whatsapp: ChannelResult;
}

function toDecisionLabel(decision: ReviewDecision): string {
  if (decision === 'APPROVED') return 'approved';
  if (decision === 'REJECTED') return 'rejected';
  return 'marked for changes';
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return null;
}

async function postWebhook(url: string, payload: Record<string, unknown>): Promise<ChannelResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { attempted: true, sent: false, reason: `Webhook failed (${res.status}): ${text}` };
    }

    return { attempted: true, sent: true };
  } catch (error: any) {
    return { attempted: true, sent: false, reason: error?.message || 'Webhook call failed' };
  }
}

export async function sendGuideProductReviewNotifications(
  input: GuideReviewNotificationInput
): Promise<ReviewNotificationResult> {
  const decisionText = toDecisionLabel(input.decision);

  const subject = `Package ${decisionText}: ${input.productTitle}`;
  const plainTextMessage = input.reviewNote;

  const emailWebhookUrl = process.env.ADMIN_REVIEW_EMAIL_WEBHOOK_URL;
  const whatsappWebhookUrl = process.env.ADMIN_REVIEW_WHATSAPP_WEBHOOK_URL;

  let email: ChannelResult = { attempted: false, sent: false, reason: 'Email webhook not configured' };
  let whatsapp: ChannelResult = { attempted: false, sent: false, reason: 'WhatsApp webhook not configured' };

  if (emailWebhookUrl && input.guideEmail) {
    email = await postWebhook(emailWebhookUrl, {
      to: input.guideEmail,
      subject,
      message: plainTextMessage,
      reviewNote: input.reviewNote,
      decision: input.decision,
      productTitle: input.productTitle,
      channel: 'EMAIL',
    });
  } else if (!input.guideEmail) {
    email = { attempted: false, sent: false, reason: 'Guide email not available' };
  }

  const normalizedPhone = normalizePhone(input.guidePhone);
  if (whatsappWebhookUrl && normalizedPhone) {
    whatsapp = await postWebhook(whatsappWebhookUrl, {
      to: normalizedPhone,
      message: plainTextMessage,
      reviewNote: input.reviewNote,
      decision: input.decision,
      productTitle: input.productTitle,
      channel: 'WHATSAPP',
    });
  } else if (!normalizedPhone) {
    whatsapp = { attempted: false, sent: false, reason: 'Guide phone not available or invalid' };
  }

  return { email, whatsapp };
}
