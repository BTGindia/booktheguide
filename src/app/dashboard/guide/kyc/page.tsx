'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import {
  Shield, CheckCircle, Clock, XCircle, Upload,
  CreditCard, Building, Wallet, AlertCircle
} from 'lucide-react';

interface KycData {
  aadhaarLast4: string | null;
  aadhaarVerified: boolean;
  aadhaarDocumentUrl: string | null;
  panNumber: string | null;
  panVerified: boolean;
  panDocumentUrl: string | null;
  bankInfo: {
    bankName: string;
    branchName: string;
    accountNumberMasked: string;
    ifsc: string;
  } | null;
  bankVerified: boolean;
  kycStatus: string;
  payoutEligible: boolean;
}

const KYC_STATUS_DISPLAY: Record<string, { label: string; color: string; icon: any }> = {
  NOT_SUBMITTED: { label: 'Not Submitted', color: 'text-gray-600', icon: AlertCircle },
  PENDING: { label: 'Under Review', color: 'text-yellow-600', icon: Clock },
  VERIFIED: { label: 'Verified', color: 'text-green-600', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'text-red-600', icon: XCircle },
};

export default function GuideKycPage() {
  const { data: session } = useSession();
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const aadhaarFileRef = useRef<HTMLInputElement>(null);
  const panFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    aadhaarLast4: '',
    aadhaarDocumentUrl: '',
    panNumber: '',
    panDocumentUrl: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    branchName: '',
  });

  useEffect(() => {
    fetch('/api/guide/kyc')
      .then(r => r.json())
      .then(d => {
        if (d.kyc) {
          setKyc(d.kyc);
          setForm(prev => ({
            ...prev,
            aadhaarLast4: d.kyc.aadhaarLast4 || '',
            aadhaarDocumentUrl: d.kyc.aadhaarDocumentUrl || '',
            panNumber: '', // Never pre-fill PAN
            panDocumentUrl: d.kyc.panDocumentUrl || '',
            bankName: d.kyc.bankInfo?.bankName || '',
            branchName: d.kyc.bankInfo?.branchName || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleDocUpload = async (field: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) { toast.error('File too large. Max 2MB.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP and PDF files allowed.'); return;
    }
    setUploading(prev => ({ ...prev, [field]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'kyc');
      const res = await fetch('/api/upload-document', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
      setForm(prev => ({ ...prev, [field]: data.url }));
      toast.success('Document uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async () => {
    // Validate Aadhaar: exactly 4 digits
    if (form.aadhaarLast4 && !/^\d{4}$/.test(form.aadhaarLast4)) {
      toast.error('Aadhaar must be 4 digits'); return;
    }
    // Validate PAN format
    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.toUpperCase())) {
      toast.error('Invalid PAN format'); return;
    }
    // Validate IFSC
    if (form.bankIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankIfsc.toUpperCase())) {
      toast.error('Invalid IFSC code'); return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/guide/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          panNumber: form.panNumber ? form.panNumber.toUpperCase() : undefined,
          bankIfsc: form.bankIfsc ? form.bankIfsc.toUpperCase() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to submit'); return; }
      toast.success('KYC details submitted for review!');
      // Refresh
      window.location.reload();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const kycStatus = kyc?.kycStatus || 'NOT_SUBMITTED';
  const statusDisplay = KYC_STATUS_DISPLAY[kycStatus] || KYC_STATUS_DISPLAY.NOT_SUBMITTED;
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark flex items-center gap-2">
          <Shield className="w-6 h-6 text-btg-terracotta" />
          KYC Verification
        </h1>
        <p className="text-gray-600 mt-1">
          Complete your identity verification for payout eligibility. Your profile can be live before KYC is complete, but payout requires verified KYC.
        </p>
      </div>

      {/* Status Banner */}
      <Card className="mb-6">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-5 h-5 ${statusDisplay.color}`} />
            <div>
              <p className={`font-semibold ${statusDisplay.color}`}>KYC Status: {statusDisplay.label}</p>
              <p className="text-xs text-gray-500">
                {kyc?.payoutEligible ? 'You are eligible for payouts' : 'Complete KYC to receive payouts'}
              </p>
            </div>
          </div>
          {kyc?.payoutEligible && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <Wallet className="w-3.5 h-3.5" /> Payout Eligible
            </span>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Aadhaar Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-btg-dark mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-btg-sage" /> Aadhaar Card
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              We store only the last 4 digits of your Aadhaar after verification. Your full Aadhaar number is never stored.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="aadhaarLast4"
                label="Last 4 digits of Aadhaar *"
                value={form.aadhaarLast4}
                onChange={(e) => setForm(prev => ({ ...prev, aadhaarLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                placeholder="XXXX"
                maxLength={4}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Document</label>
                <input ref={aadhaarFileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => e.target.files?.[0] && handleDocUpload('aadhaarDocumentUrl', e.target.files[0])} className="hidden" />
                {form.aadhaarDocumentUrl ? (
                  <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Document uploaded</p>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => aadhaarFileRef.current?.click()} isLoading={uploading.aadhaarDocumentUrl}>
                    <Upload className="w-4 h-4 mr-1" /> Upload Aadhaar
                  </Button>
                )}
              </div>
            </div>
            {kyc?.aadhaarVerified && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Aadhaar verified</p>
            )}
          </CardContent>
        </Card>

        {/* PAN Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-btg-dark mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-btg-sage" /> PAN Card
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Required for guides earning above the tax threshold.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="panNumber"
                label="PAN Number"
                value={form.panNumber}
                onChange={(e) => setForm(prev => ({ ...prev, panNumber: e.target.value.toUpperCase().slice(0, 10) }))}
                placeholder="ABCDE1234F"
                maxLength={10}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Document</label>
                <input ref={panFileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => e.target.files?.[0] && handleDocUpload('panDocumentUrl', e.target.files[0])} className="hidden" />
                {form.panDocumentUrl ? (
                  <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Document uploaded</p>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => panFileRef.current?.click()} isLoading={uploading.panDocumentUrl}>
                    <Upload className="w-4 h-4 mr-1" /> Upload PAN
                  </Button>
                )}
              </div>
            </div>
            {kyc?.panVerified && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> PAN verified</p>
            )}
          </CardContent>
        </Card>

        {/* Bank Account Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-btg-dark mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-btg-sage" /> Bank Account (for payouts)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Bank details are stored encrypted. We use this only for payouts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="bankAccountNumber" label="Account Number" type="password" value={form.bankAccountNumber} onChange={(e) => setForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))} placeholder="Enter account number" />
              <Input id="bankIfsc" label="IFSC Code" value={form.bankIfsc} onChange={(e) => setForm(prev => ({ ...prev, bankIfsc: e.target.value.toUpperCase() }))} placeholder="e.g. SBIN0001234" maxLength={11} />
              <Input id="bankName" label="Bank Name" value={form.bankName} onChange={(e) => setForm(prev => ({ ...prev, bankName: e.target.value }))} placeholder="e.g. State Bank of India" />
              <Input id="branchName" label="Branch Name" value={form.branchName} onChange={(e) => setForm(prev => ({ ...prev, branchName: e.target.value }))} placeholder="e.g. Main Branch, Delhi" />
            </div>
            {kyc?.bankInfo?.accountNumberMasked && (
              <p className="text-xs text-gray-500 mt-2">
                Current account: {kyc.bankInfo.accountNumberMasked} | {kyc.bankInfo.bankName}
                {kyc.bankVerified && <span className="text-green-600 ml-2">✓ Verified</span>}
              </p>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} isLoading={loading} className="w-full">
          Submit KYC for Verification
        </Button>
      </div>
    </div>
  );
}
