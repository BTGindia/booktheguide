'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Upload, CheckCircle, Clock, XCircle,
  AlertTriangle, FileText, Shield
} from 'lucide-react';

interface Certification {
  id: string;
  certType: string;
  issuingAuthority: string;
  certificateNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  documentUrl: string | null;
  verificationStatus: string;
  rejectionReason: string | null;
}

interface Taxonomy {
  certificationTypes: string[];
  issuingAuthorities: string[];
}

const STATUS_DISPLAY: Record<string, { label: string; icon: any; color: string }> = {
  PENDING: { label: 'Pending Review', icon: Clock, color: 'text-yellow-600' },
  VERIFIED: { label: 'Verified', icon: CheckCircle, color: 'text-green-600' },
  REJECTED: { label: 'Rejected', icon: XCircle, color: 'text-red-600' },
  EXPIRED: { label: 'Expired', icon: AlertTriangle, color: 'text-orange-600' },
};

export default function GuideCertificationsPage() {
  const { data: session } = useSession();
  const [certs, setCerts] = useState<Certification[]>([]);
  const [taxonomy, setTaxonomy] = useState<Taxonomy>({ certificationTypes: [], issuingAuthorities: [] });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    certType: '',
    issuingAuthority: '',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    documentUrl: '',
  });

  useEffect(() => {
    // Fetch taxonomy
    fetch('/api/taxonomy')
      .then(r => r.json())
      .then(d => setTaxonomy({
        certificationTypes: d.certificationTypes || [],
        issuingAuthorities: d.issuingAuthorities || [],
      }))
      .catch(() => {});

    // Fetch certifications
    fetchCerts();
  }, []);

  const fetchCerts = () => {
    fetch('/api/guide/certifications')
      .then(r => r.json())
      .then(d => setCerts(d.certifications || []))
      .catch(() => {});
  };

  const handleDocUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max 2MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP and PDF files allowed.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'certifications');
      const res = await fetch('/api/upload-document', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
      setForm(prev => ({ ...prev, documentUrl: data.url }));
      toast.success('Document uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.certType) { toast.error('Select certification type'); return; }
    if (!form.issuingAuthority) { toast.error('Select issuing authority'); return; }

    // Validate expiry date is in the future
    if (form.expiryDate && new Date(form.expiryDate) <= new Date()) {
      toast.error('Expiry date must be in the future');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/guide/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to add certification'); return; }

      toast.success('Certification added successfully!');
      setForm({ certType: '', issuingAuthority: '', certificateNumber: '', issueDate: '', expiryDate: '', documentUrl: '' });
      setShowForm(false);
      fetchCerts();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (certId: string) => {
    if (!confirm('Remove this certification?')) return;
    try {
      const res = await fetch(`/api/guide/certifications?id=${certId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Certification removed');
        fetchCerts();
      } else {
        toast.error('Failed to remove');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const daysLeft = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 60;
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark flex items-center gap-2">
          <Shield className="w-6 h-6 text-btg-terracotta" />
          Certifications
        </h1>
        <p className="text-gray-600 mt-1">
          Add your professional certifications. These are verified by our team and displayed on your profile.
        </p>
      </div>

      {/* Existing Certifications */}
      {certs.length > 0 ? (
        <div className="space-y-4 mb-6">
          {certs.map((cert) => {
            const status = STATUS_DISPLAY[cert.verificationStatus] || STATUS_DISPLAY.PENDING;
            const Icon = status.icon;
            const expiring = isExpiringSoon(cert.expiryDate);

            return (
              <Card key={cert.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-btg-dark">{cert.certType}</h3>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{cert.issuingAuthority}</p>
                      {cert.certificateNumber && (
                        <p className="text-xs text-gray-400 mt-1">Certificate #: {cert.certificateNumber}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        {cert.issueDate && <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>}
                        {cert.expiryDate && (
                          <span className={expiring ? 'text-orange-600 font-medium' : ''}>
                            {expiring && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                            Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {cert.rejectionReason && (
                        <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                          Rejection reason: {cert.rejectionReason}
                        </p>
                      )}
                      {cert.documentUrl && (
                        <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-btg-terracotta mt-2 hover:underline">
                          <FileText className="w-3 h-3" /> View Document
                        </a>
                      )}
                    </div>
                    <button onClick={() => handleDelete(cert.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No certifications added yet</p>
            <p className="text-xs text-gray-400">
              Add your professional certifications to boost your profile visibility and trust score.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Certification Form */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Certification
        </Button>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-btg-dark mb-4">Add New Certification</h3>

            <Select
              id="certType"
              label="Certification Type *"
              value={form.certType}
              onChange={(e) => setForm(prev => ({ ...prev, certType: e.target.value }))}
              placeholder="Select certification type"
              options={taxonomy.certificationTypes.map(t => ({ value: t, label: t }))}
            />

            <Select
              id="issuingAuthority"
              label="Issuing Authority *"
              value={form.issuingAuthority}
              onChange={(e) => setForm(prev => ({ ...prev, issuingAuthority: e.target.value }))}
              placeholder="Select issuing authority"
              options={taxonomy.issuingAuthorities.map(a => ({ value: a, label: a }))}
            />

            <Input
              id="certificateNumber"
              label="Certificate Number"
              value={form.certificateNumber}
              onChange={(e) => setForm(prev => ({ ...prev, certificateNumber: e.target.value }))}
              placeholder="Enter certificate number"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm(prev => ({ ...prev, issueDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Must be in the future</p>
              </div>
            </div>

            {/* Document upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Document</label>
              {form.documentUrl ? (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-700">Document uploaded</span>
                  <button onClick={() => setForm(prev => ({ ...prev, documentUrl: '' }))} className="text-red-500 text-xs hover:underline">Remove</button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={uploading}
                  >
                    <Upload className="w-4 h-4 mr-1" /> Upload Document
                  </Button>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP or PDF. Max 2MB.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} isLoading={loading}>Save Certification</Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setForm({ certType: '', issuingAuthority: '', certificateNumber: '', issueDate: '', expiryDate: '', documentUrl: '' }); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
