'use client';

import { Shield, CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: any;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}> = {
  UNVERIFIED: {
    label: 'Unverified',
    icon: AlertTriangle,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    description: 'Complete your profile and submit for review to become discoverable.',
  },
  IN_REVIEW: {
    label: 'In Review',
    icon: Clock,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    description: 'Your documents are being reviewed by our team. This usually takes 1-2 business days.',
  },
  VERIFIED: {
    label: 'Verified',
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    description: 'Your profile is verified and visible in search results.',
  },
  SUSPENDED: {
    label: 'Suspended',
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    description: 'Your profile has been suspended. Please contact support for assistance.',
  },
};

interface Props {
  status: string;
  compact?: boolean;
}

export default function VerificationStatusBadge({ status, compact = false }: Props) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNVERIFIED;
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  }

  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.textColor}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${config.textColor}`} />
            <span className={`font-semibold ${config.textColor}`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
        </div>
      </div>
    </div>
  );
}
