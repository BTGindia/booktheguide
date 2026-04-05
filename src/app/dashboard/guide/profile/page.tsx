'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ImageUpload, MultiImageUpload } from '@/components/ui/ImageUpload';
import {
  LANGUAGES as TAXONOMY_LANGUAGES,
  GUIDE_TYPES as TAXONOMY_GUIDE_TYPES,
  SPECIALIZATIONS as TAXONOMY_SPECIALIZATIONS,
  GENDER_OPTIONS as TAXONOMY_GENDER_OPTIONS,
  ID_PROOF_TYPES as TAXONOMY_ID_PROOF_TYPES,
} from '@/lib/taxonomy';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle, AlertCircle, Shield, Phone } from 'lucide-react';

interface SpecializationProof {
  specialization: string;
  description: string;
  documentUrl: string;
}

interface CertificationDoc {
  name: string;
  documentUrl: string;
}

interface TermsConditions {
  id: string;
  title: string;
  content: string;
  state: string | null;
  guideType: string | null;
}

const GUIDE_TYPES = [...TAXONOMY_GUIDE_TYPES];

const SPECIALIZATIONS = [...TAXONOMY_SPECIALIZATIONS, 'Other'] as string[];

const GENDER_OPTIONS = [...TAXONOMY_GENDER_OPTIONS];

const MARITAL_OPTIONS = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

const ID_PROOF_OPTIONS = [...TAXONOMY_ID_PROOF_TYPES];

const LANGUAGES = [...TAXONOMY_LANGUAGES] as string[];

export default function GuideProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState<{ id: string; name: string }[]>([]);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [terms, setTerms] = useState<TermsConditions[]>([]);
  const [agreementTab, setAgreementTab] = useState<'trek' | 'adventure'>('trek');
  const [certUploading, setCertUploading] = useState<Record<number, boolean>>({});
  const certInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [form, setForm] = useState({
    bio: '',
    tagline: '',
    displayName: '',
    shortBio: '',
    maxAltitudeLed: 0,
    addressLine: '',
    cityTown: '',
    district: '',
    addressState: '',
    country: 'India',
    pincode: '',
    phone: '',
    email: '',
    selectedState: '' as string,
    experienceYears: 0,
    education: '',
    certifications: [''],
    certificationDocs: [] as CertificationDoc[],
    languages: [] as string[],
    specializations: [] as string[],
    otherSpecialization: '',
    specializationProofs: [] as SpecializationProof[],
    idProofType: '',
    idProofNumber: '',
    profileImage: '',
    coverImage: '',
    portfolioImages: [] as string[],
    gender: '',
    dateOfBirth: '',
    maritalStatus: '',
    guideTypes: [] as string[],
    termsAccepted: false,
  });

  useEffect(() => {
    fetch('/api/geography/states')
      .then((r) => r.json())
      .then((data) => setStates(data.states || []))
      .catch(() => {});

    fetch('/api/guide/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          const serviceArea = (data.profile.serviceAreas || [])[0];
          const stateId = serviceArea?.stateId || '';
          let proofs: SpecializationProof[] = [];
          try {
            const parsed = typeof data.profile.specializationProofs === 'string'
              ? JSON.parse(data.profile.specializationProofs)
              : data.profile.specializationProofs;
            if (Array.isArray(parsed)) proofs = parsed;
          } catch {}

          let certDocs: CertificationDoc[] = [];
          try {
            const parsed = typeof data.profile.certificationDocs === 'string'
              ? JSON.parse(data.profile.certificationDocs)
              : data.profile.certificationDocs;
            if (Array.isArray(parsed)) certDocs = parsed;
          } catch {}

          const specs = data.profile.specializations || [];
          const knownSpecs = SPECIALIZATIONS.filter(s => s !== 'Other');
          const otherSpecs = specs.filter((s: string) => !knownSpecs.includes(s) && s !== 'Other');
          const hasOther = specs.includes('Other') || otherSpecs.length > 0;
          const normalizedSpecs = specs.filter((s: string) => knownSpecs.includes(s));
          if (hasOther) normalizedSpecs.push('Other');

          setPhoneVerified(data.profile.phoneVerified || false);

          setForm({
            bio: data.profile.bio || '',
            tagline: data.profile.tagline || '',
            displayName: data.profile.displayName || '',
            shortBio: data.profile.shortBio || '',
            maxAltitudeLed: data.profile.maxAltitudeLed || 0,
            addressLine: data.profile.addressLine || '',
            cityTown: data.profile.cityTown || '',
            district: data.profile.district || '',
            addressState: data.profile.addressState || '',
            country: data.profile.country || 'India',
            pincode: data.profile.pincode || '',
            phone: data.profile.phone || '',
            email: data.profile.email || '',
            selectedState: stateId,
            experienceYears: data.profile.experienceYears || 0,
            education: data.profile.education || '',
            certifications: data.profile.certifications?.length > 0 ? data.profile.certifications : [''],
            certificationDocs: certDocs,
            languages: data.profile.languages || [],
            specializations: normalizedSpecs,
            otherSpecialization: otherSpecs.join(', '),
            specializationProofs: proofs,
            idProofType: data.profile.idProofType || '',
            idProofNumber: data.profile.idProofNumber || '',
            profileImage: data.profile.user?.image || '',
            coverImage: data.profile.coverImage || '',
            portfolioImages: data.profile.portfolioImages || [],
            gender: data.profile.gender || '',
            dateOfBirth: data.profile.dateOfBirth ? new Date(data.profile.dateOfBirth).toISOString().split('T')[0] : '',
            maritalStatus: data.profile.maritalStatus || '',
            guideTypes: data.profile.guideTypes || [],
            termsAccepted: data.profile.termsAccepted || false,
          });
        }
      })
      .catch(() => {});

    // Fetch terms & conditions
    fetch('/api/guide/terms')
      .then((r) => r.json())
      .then((data) => setTerms(data.terms || []))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArrayItem = (key: 'languages' | 'specializations' | 'guideTypes', item: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(item)
        ? (prev[key] as string[]).filter((i) => i !== item)
        : [...(prev[key] as string[]), item],
    }));
  };

  const handleCertChange = (index: number, value: string) => {
    const updated = [...form.certifications];
    updated[index] = value;
    setForm((prev) => ({ ...prev, certifications: updated }));
  };

  const addCertification = () => setForm((prev) => ({ ...prev, certifications: [...prev.certifications, ''] }));
  const removeCertification = (index: number) => {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
      certificationDocs: prev.certificationDocs.filter((_, i) => i !== index),
    }));
  };

  const updateSpecProof = (index: number, field: keyof SpecializationProof, value: string) => {
    setForm((prev) => {
      const updated = [...prev.specializationProofs];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, specializationProofs: updated };
    });
  };

  // Pincode lookup
  const lookupPincode = async (pincode: string) => {
    if (!/^\d{6}$/.test(pincode)) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`/api/geography/pincode?pincode=${pincode}`);
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({
          ...prev,
          district: data.district || '',
          addressState: data.state || '',
          country: data.country || 'India',
        }));
        toast.success('Address details fetched from pincode');
      } else {
        toast.error(data.error || 'Pincode not found');
      }
    } catch {
      toast.error('Failed to lookup pincode');
    } finally {
      setPincodeLoading(false);
    }
  };

  // OTP flow
  const sendOtp = async () => {
    if (!/^\d{10}$/.test(form.phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/guide/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phone: form.phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        toast.success('OTP sent to your phone');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpValue) {
      toast.error('Enter the OTP');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/guide/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', phone: form.phone, otp: otpValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhoneVerified(true);
        setOtpSent(false);
        toast.success('Phone verified successfully!');
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  // Certificate document upload
  const handleCertDocUpload = async (index: number, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max 2MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP and PDF files allowed.');
      return;
    }
    setCertUploading((prev) => ({ ...prev, [index]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'certifications');
      const res = await fetch('/api/upload-document', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Upload failed');
        return;
      }
      setForm((prev) => {
        const updatedDocs = [...prev.certificationDocs];
        updatedDocs[index] = { name: prev.certifications[index] || '', documentUrl: data.url };
        return { ...prev, certificationDocs: updatedDocs };
      });
      toast.success('Certificate uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setCertUploading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!form.profileImage) { toast.error('Profile picture is required'); return; }
    if (form.portfolioImages.length < 4) { toast.error('Please upload at least 4 portfolio photos'); return; }
    if (!form.selectedState) { toast.error('Please select your operating state'); return; }
    if (form.guideTypes.length === 0) { toast.error('Please select at least one guide type'); return; }
    if (!form.phone || !phoneVerified) { toast.error('Phone verification is mandatory'); return; }
    if (!form.idProofType || !form.idProofNumber) { toast.error('ID verification is mandatory'); return; }
    if (!form.termsAccepted) { toast.error('Please accept the terms and conditions'); return; }
    if (form.specializations.includes('Other') && !form.otherSpecialization.trim()) { toast.error('Please describe your "Other" specialization'); return; }

    setLoading(true);
    try {
      const finalSpecs = [...form.specializations.filter(s => s !== 'Other')];
      if (form.specializations.includes('Other') && form.otherSpecialization.trim()) {
        finalSpecs.push('Other');
        finalSpecs.push(form.otherSpecialization.trim());
      }

      const res = await fetch('/api/guide/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          specializations: finalSpecs,
          selectedStates: [form.selectedState],
          certifications: form.certifications.filter((c) => c.trim() !== ''),
          experienceYears: Number(form.experienceYears),
          maxAltitudeLed: Number(form.maxAltitudeLed) || 0,
          dateOfBirth: form.dateOfBirth || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to save profile'); return; }
      toast.success('Profile saved successfully!');
    } catch { toast.error('Something went wrong'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Guide Profile</h1>
        <p className="text-gray-600 mt-1">Set up your profile to start receiving bookings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture & Cover */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-btg-dark mb-2">Profile Picture & Cover</h2>
            <p className="text-sm text-gray-500 mb-3">Your profile picture will be shown on all your packages and search results. <span className="text-red-500 font-medium">Profile picture is required.*</span></p>
            <div className="flex flex-col sm:flex-row gap-6">
              <div>
                <ImageUpload folder="guides" value={form.profileImage} onChange={(url) => setForm(prev => ({ ...prev, profileImage: url }))} label="Profile Picture *" rounded size="md" />
                {!form.profileImage && <p className="text-xs text-red-500 mt-1">Required</p>}
              </div>
              <ImageUpload folder="guides" value={form.coverImage} onChange={(url) => setForm(prev => ({ ...prev, coverImage: url }))} label="Cover Image (Optional)" size="lg" className="flex-1" />
            </div>
          </CardContent>
        </Card>

        {/* Portfolio / Gallery */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-2">Portfolio / Gallery <span className="text-red-500">*</span></h2>
            <p className="text-sm text-gray-500 mb-3">Upload at least <strong>4 photos</strong> from your trips to complete your profile (max 10).</p>
            <MultiImageUpload folder="guides" values={form.portfolioImages} onChange={(urls) => setForm(prev => ({ ...prev, portfolioImages: urls }))} label="" maxImages={10} />
            {form.portfolioImages.length < 4 && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Minimum 4 photos required ({form.portfolioImages.length}/4 uploaded)
              </p>
            )}
            {form.portfolioImages.length >= 4 && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> {form.portfolioImages.length} photos uploaded
              </p>
            )}
          </CardContent>
        </Card>

        {/* Personal Details (includes contact, demographics, and ID verification) */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="font-bold text-btg-dark mb-2">Personal Details</h2>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input id="phone" name="phone" label="Phone Number *" value={form.phone} onChange={(e) => {
                    handleChange(e);
                    if (phoneVerified) setPhoneVerified(false);
                    setOtpSent(false);
                  }} placeholder="10-digit mobile number" maxLength={10} />
                  {phoneVerified && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</p>
                  )}
                </div>
                <Input id="email" name="email" label="Email ID" type="email" value={form.email} onChange={handleChange} placeholder="your.email@example.com" />
              </div>
            </div>

            {/* Demographics */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Demographics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select id="gender" name="gender" label="Gender" value={form.gender} onChange={handleChange} placeholder="Select Gender" options={GENDER_OPTIONS} />
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent text-sm" />
                  {form.dateOfBirth && <p className="text-xs text-btg-light-text mt-1">Age: {Math.floor((Date.now() - new Date(form.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years</p>}
                </div>
                <Select id="maritalStatus" name="maritalStatus" label="Marital Status" value={form.maritalStatus} onChange={handleChange} placeholder="Select Status" options={MARITAL_OPTIONS} />
              </div>
            </div>

            {/* ID Verification */}
            <div className="border-t pt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> ID Verification <span className="text-red-500">*</span>
              </h3>
              <p className="text-xs text-gray-500 mb-3">Complete ID and phone verification to activate your guide profile. This is mandatory.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Select id="idProofType" name="idProofType" label="ID Proof Type *" value={form.idProofType} onChange={handleChange} placeholder="Select ID Type" options={ID_PROOF_OPTIONS} />
                <Input id="idProofNumber" name="idProofNumber" label="ID Number *" value={form.idProofNumber} onChange={handleChange} placeholder="Enter ID number" />
              </div>

              {/* OTP Verification */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-3">Phone Verification (OTP)</p>
                {!phoneVerified ? (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-700">We will send an OTP to your phone number: <strong>{form.phone || '(enter phone above)'}</strong></p>
                    {!otpSent ? (
                      <Button type="button" onClick={sendOtp} isLoading={otpLoading} size="sm" disabled={!form.phone || form.phone.length !== 10}>
                        Send OTP
                      </Button>
                    ) : (
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Enter OTP</label>
                          <input type="text" value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit OTP" maxLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40" />
                        </div>
                        <Button type="button" onClick={verifyOtp} isLoading={otpLoading} size="sm">
                          Verify
                        </Button>
                        <button type="button" onClick={sendOtp} className="text-xs text-btg-terracotta hover:underline whitespace-nowrap pb-2.5">
                          Resend
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Phone verified successfully</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info — Tagline, Bio, Address */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-btg-dark mb-2">Basic Information</h2>

            <div>
              <Input id="displayName" name="displayName" label="Display Name" value={form.displayName} onChange={handleChange} placeholder="e.g., Rajesh Kumar" helperText="The name shown to travellers on your profile and packages" />
            </div>

            <div>
              <Input id="tagline" name="tagline" label="Tagline" value={form.tagline} onChange={handleChange} placeholder="e.g., Best Trek Guide in Manali – Safe Himalayan Treks for Beginners" helperText="A short catchy line about you (max 100 chars)" />
              <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-3 py-1.5 rounded">
                💡 <strong>Example:</strong> &quot;Experienced Trek Guide in Rishikesh – Safe River Rafting &amp; Camping Trips&quot; or &quot;Kedarnath Trek Expert – 10 Years Himalayan Experience&quot;. Use your location and what you do best!
              </p>
            </div>

            <div>
              <Textarea id="bio" name="bio" label="Bio / About You" value={form.bio} onChange={handleChange} placeholder="Tell travellers about your experience, what makes you unique as a guide..." rows={5} />
              <div className="text-xs text-blue-600 mt-1 bg-blue-50 px-3 py-2 rounded space-y-1">
                <p>💡 <strong>Example:</strong></p>
                <p>&quot;My name is Rajesh and I am a trek guide from Manali, Himachal Pradesh. I have been doing Himalayan treks for 8 years. I have guided many groups to Hampta Pass, Bhrigu Lake, and Chandratal. I know all the mountain trails, safe camping spots, and local food places. I speak Hindi, English, and Pahadi. Whether you are a beginner or experienced trekker, I will make sure your trip is safe and fun. I am certified from ABVIMAS Manali. Book a trek with me and explore the real Himalayas!&quot;</p>
                <p className="text-gray-500 italic">Write about yourself, your experience, what places you know, and why travellers should choose you.</p>
              </div>
            </div>

            <div>
              <Textarea id="shortBio" name="shortBio" label="Short Bio (for cards & search results)" value={form.shortBio} onChange={handleChange} placeholder="A 2-3 sentence summary shown on search cards (max 200 chars)" rows={2} />
            </div>

            {/* Structured Address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <Textarea id="addressLine" name="addressLine" label="House / Street / Village" value={form.addressLine} onChange={handleChange} placeholder="e.g., House No. 12, Near Bus Stand, Old Manali" rows={2} />
                <Input id="cityTown" name="cityTown" label="City / Town" value={form.cityTown} onChange={handleChange} placeholder="e.g., Manali" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <Input id="pincode" name="pincode" label="Pin Code" value={form.pincode} onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setForm(prev => ({ ...prev, pincode: val }));
                    if (val.length === 6) lookupPincode(val);
                  }} placeholder="6-digit pincode" maxLength={6} />
                  {pincodeLoading && <p className="text-xs text-gray-500 mt-1">Looking up...</p>}
                </div>
                <Input id="district" name="district" label="District" value={form.district} onChange={handleChange} placeholder="Auto-filled from pincode" />
                <Input id="addressState" name="addressState" label="State" value={form.addressState} onChange={handleChange} placeholder="Auto-filled from pincode" />
                <Input id="country" name="country" label="Country" value={form.country} onChange={handleChange} placeholder="India" disabled />
              </div>
              <p className="text-xs text-gray-500 mt-2">Enter your pincode and district, state, country will be filled automatically.</p>
            </div>
          </CardContent>
        </Card>

        {/* Type of Guide */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-1">Type of Guide <span className="text-red-500">*</span></h2>
            <p className="text-sm text-gray-500 mb-3">Select all that apply &mdash; this determines which categories your packages appear in</p>
            <div className="flex flex-wrap gap-2">
              {GUIDE_TYPES.map((gt) => (
                <button key={gt.value} type="button" onClick={() => toggleArrayItem('guideTypes', gt.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.guideTypes.includes(gt.value) ? 'bg-btg-terracotta text-white border-btg-terracotta shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-btg-blush'}`}>
                  {gt.label}
                </button>
              ))}
            </div>
            {form.guideTypes.length === 0 && <p className="text-xs text-red-500 mt-2">Please select at least one guide type</p>}
          </CardContent>
        </Card>

        {/* Operating State */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-btg-dark mb-2">Operating State <span className="text-red-500">*</span></h2>
            <p className="text-sm text-gray-500 mb-3">Select the state where you operate and offer your services.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operating State</label>
              <select name="selectedState" value={form.selectedState} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent text-sm">
                <option value="">Select your state</option>
                {states.map((state) => (<option key={state.id} value={state.id}>{state.name}</option>))}
              </select>
              {!form.selectedState && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
          </CardContent>
        </Card>

        {/* Professional Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-btg-dark mb-2">Professional Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input id="experienceYears" name="experienceYears" label="Years of Experience" type="number" min={0} value={form.experienceYears} onChange={handleChange} />
              <Input id="education" name="education" label="Education" value={form.education} onChange={handleChange} placeholder="e.g., B.Sc. in Tourism Management" />
              <Input id="maxAltitudeLed" name="maxAltitudeLed" label="Max Altitude Led (ft)" type="number" min={0} value={form.maxAltitudeLed} onChange={handleChange} placeholder="e.g., 18000" helperText="Highest altitude you've led clients to" />
            </div>

            {/* Certifications & Courses with Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certifications & Courses</label>
              <p className="text-xs text-gray-500 mb-3">Add your certifications and upload the certificate image or PDF for each.</p>
              {form.certifications.map((cert, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 mb-3">
                  <div className="flex gap-2 mb-2">
                    <Input value={cert} onChange={(e) => handleCertChange(i, e.target.value)} placeholder="e.g., Basic Mountaineering Course (ABVIMAS)" className="flex-1" />
                    {form.certifications.length > 1 && <button type="button" onClick={() => removeCertification(i)} className="text-red-500 hover:text-red-700 px-2 self-center">&times;</button>}
                  </div>
                  <div className="flex items-center gap-3">
                    {form.certificationDocs[i]?.documentUrl ? (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                        <FileText className="w-4 h-4" />
                        <span>Certificate uploaded</span>
                        <button type="button" onClick={() => {
                          setForm(prev => {
                            const updated = [...prev.certificationDocs];
                            updated[i] = { name: '', documentUrl: '' };
                            return { ...prev, certificationDocs: updated };
                          });
                        }} className="text-red-500 hover:text-red-700 ml-1 text-xs">(remove)</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => certInputRefs.current[i]?.click()}
                        className="flex items-center gap-1.5 text-sm text-btg-terracotta border border-btg-terracotta/30 hover:bg-btg-blush/20 px-3 py-1.5 rounded-lg transition-colors"
                        disabled={certUploading[i]}>
                        {certUploading[i] ? (
                          <div className="animate-spin w-4 h-4 border-2 border-btg-terracotta border-t-transparent rounded-full" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload Certificate (Image/PDF, max 2MB)
                      </button>
                    )}
                    <input ref={(el) => { certInputRefs.current[i] = el; }} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCertDocUpload(i, file);
                      e.target.value = '';
                    }} className="hidden" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addCertification} className="text-sm text-btg-terracotta hover:underline">+ Add Certification</button>
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-3">Languages Spoken</h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button key={lang} type="button" onClick={() => toggleArrayItem('languages', lang)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${form.languages.includes(lang) ? 'bg-btg-terracotta text-white border-btg-terracotta' : 'bg-white text-gray-600 border-gray-200 hover:border-btg-blush'}`}>
                  {lang}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Specializations */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-1">Specializations</h2>
            <p className="text-sm text-gray-500 mb-3">Select the types of experiences you offer. These become the activity types when you create packages.</p>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((spec) => (
                <button key={spec} type="button" onClick={() => toggleArrayItem('specializations', spec)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${form.specializations.includes(spec) ? 'bg-btg-sage text-white border-btg-sage' : 'bg-white text-gray-600 border-gray-200 hover:border-btg-sage'}`}>
                  {spec}
                </button>
              ))}
            </div>
            {form.specializations.includes('Other') && (
              <div className="mt-4">
                <Input id="otherSpecialization" name="otherSpecialization" label="Tell us more about your specialization" value={form.otherSpecialization} onChange={handleChange} placeholder="Describe your unique specialization..." />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specialization Proofs */}
        {form.specializations.filter(s => s !== 'Other').length > 0 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="font-bold text-btg-dark mb-1">Proof of Specialization</h2>
                <p className="text-sm text-gray-500">Upload certificates or documents proving your expertise</p>
              </div>
              <div className="space-y-4">
                {form.specializations.filter(s => s !== 'Other').map((spec) => {
                  const existingProof = form.specializationProofs.find((p) => p.specialization === spec);
                  return (
                    <div key={spec} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{spec}</span>
                        {existingProof ? <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Uploaded</span> : <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" value={existingProof?.description || ''} onChange={(e) => {
                          const proofIdx = form.specializationProofs.findIndex((p) => p.specialization === spec);
                          if (proofIdx >= 0) updateSpecProof(proofIdx, 'description', e.target.value);
                          else setForm((prev) => ({ ...prev, specializationProofs: [...prev.specializationProofs, { specialization: spec, description: e.target.value, documentUrl: '' }] }));
                        }} placeholder="Certificate name / description" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40" />
                        <input type="url" value={existingProof?.documentUrl || ''} onChange={(e) => {
                          const proofIdx = form.specializationProofs.findIndex((p) => p.specialization === spec);
                          if (proofIdx >= 0) updateSpecProof(proofIdx, 'documentUrl', e.target.value);
                          else setForm((prev) => ({ ...prev, specializationProofs: [...prev.specializationProofs, { specialization: spec, description: '', documentUrl: e.target.value }] }));
                        }} placeholder="Document URL (uploaded link)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Terms & Conditions */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold text-btg-dark mb-2">Agreement & Terms & Conditions <span className="text-red-500">*</span></h2>
            {terms.length > 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto text-sm text-gray-700 space-y-3">
                {terms.map((term) => (
                  <div key={term.id}>
                    <h3 className="font-semibold text-gray-800">{term.title}</h3>
                    <div className="whitespace-pre-wrap text-xs mt-1">{term.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex border-b border-gray-200">
                  <button type="button" onClick={() => setAgreementTab('trek')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${agreementTab === 'trek' ? 'border-btg-terracotta text-btg-terracotta' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Trek Guide Agreement
                  </button>
                  <button type="button" onClick={() => setAgreementTab('adventure')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${agreementTab === 'adventure' ? 'border-btg-terracotta text-btg-terracotta' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Adventure Guide Agreement
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-72 overflow-y-auto text-sm text-gray-700 space-y-3">
                  {agreementTab === 'trek' ? (
                    <div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">BOOK THE GUIDE – TREK GUIDE AGREEMENT AND TERMS &amp; CONDITIONS</h3>
                      <p className="text-xs text-gray-500 mb-3">Category: Trek Guide &bull; Commission: 15%</p>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">1. Definitions</h4>
                      <ul className="list-disc pl-5 space-y-0.5 text-xs">
                        <li>&ldquo;Platform&rdquo; – BTG&rsquo;s website, app, and related services.</li>
                        <li>&ldquo;Trek Experience&rdquo; – Any guided trek, hiking, or mountain walking activity listed by you.</li>
                        <li>&ldquo;Traveller&rdquo; – Any person who books a Trek Experience through the Platform.</li>
                        <li>&ldquo;Booking&rdquo; – A confirmed reservation.</li>
                        <li>&ldquo;Commission&rdquo; – 15% of the total Booking value (unless otherwise specified in a promotional period).</li>
                        <li>&ldquo;Earnings&rdquo; – Total Booking value minus Commission and applicable taxes.</li>
                      </ul>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">2. Eligibility and Registration</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You must be at least 18 years old and legally permitted to guide treks in your location.</li>
                        <li>You must hold valid trek‑related certifications. Minimum requirement: NIMAS (Basic or above), or equivalent recognised mountaineering/trekking certification. You may also hold WFR (Wilderness First Responder) or First Aid – these are strongly recommended.</li>
                        <li>You agree to provide accurate identification (Aadhaar) and a clear profile photo. BTG reserves the right to verify your certifications with issuing authorities.</li>
                        <li>Your profile and any Trek Experience listing are subject to approval. BTG may reject or remove listings that do not meet safety, quality, or legal standards.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">3. Package Details Accuracy and No False Information</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You represent and warrant that all information provided in your Trek Experience listings (including but not limited to difficulty level, duration, altitude, distance, inclusions, exclusions, meeting point, itinerary, required gear, and best months) is true, accurate, and not misleading.</li>
                        <li>You shall not exaggerate, omit material facts, or make false claims about the trek, the terrain, the services provided, or your qualifications.</li>
                        <li>Any Traveller complaint arising from inaccurate or false information may result in suspension of your profile, withholding of payments, and permanent removal from the Platform.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">4. Listing Trek Experiences</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You create listings via your Guide Dashboard. Each Trek Experience must include: accurate difficulty level, duration, altitude, distance, detailed inclusions and exclusions, meeting point and itinerary summary, required gear for travellers, and best months for the trek.</li>
                        <li>You retain ownership of your photos and descriptions, but grant BTG a non‑exclusive, royalty‑free licence to use them for promotion.</li>
                        <li>Safety First: You must not list any trek that requires technical mountaineering skills unless you hold the appropriate certifications and insurance.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">5. Pricing and Payment</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You set the price for each Trek Experience. The price displayed on the Platform is the total amount payable by the Traveller, inclusive of all taxes and fees.</li>
                        <li>BTG collects the full payment from the Traveller at the time of booking. BTG deducts its Commission and remits the balance to you as Earnings.</li>
                        <li>You agree that you will not charge Travellers any additional fees outside the Platform for the booked trek unless agreed in writing and disclosed in the listing.</li>
                        <li>Payout: Your Earnings are paid within 3 business days after the trek is completed, provided no dispute exists. Payouts are made to your bank account or UPI.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">6. Bookings and Commission</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>When a Traveller books a Trek Experience, BTG sends you a WhatsApp notification. You must contact the Traveller within 4 hours to confirm details, weather conditions, and any pre‑trek requirements.</li>
                        <li>All payments are processed by BTG. The Traveller pays the full amount at booking.</li>
                        <li>Commission: BTG deducts 15% of the total Booking value. First 60 days from profile go‑live: Commission reduced to 10%. BTG Select Badge: After completing 10 treks through BTG, your commission reduces to 13% permanently.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">7. Cancellations and Refunds</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You define a cancellation policy for each trek. BTG administers refunds according to that policy.</li>
                        <li>If you cancel a confirmed trek (except for genuine emergencies or force majeure), BTG may deduct the Commission from your future earnings as a penalty and/or suspend or remove your profile.</li>
                        <li>Disputes over cancellations or quality of service are resolved by BTG, whose decision is final. BTG may withhold payout until resolution.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">8. Your Responsibilities as a Trek Guide</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>Safety and Conduct: You are solely responsible for the safety of Travellers during the trek. You must carry a first‑aid kit, maintain group discipline, and act professionally at all times.</li>
                        <li>Certifications: You must keep your trekking certifications current. Failure to do so may result in suspension.</li>
                        <li>Insurance: You must carry appropriate liability insurance. BTG does not provide insurance for Guides.</li>
                        <li>Environmental Responsibility: You must follow Leave No Trace principles and respect local regulations regarding forests, wildlife, and waste disposal.</li>
                        <li>Prohibited Conduct: You shall not solicit bookings outside the Platform, misrepresent trail conditions, or engage in any unsafe or discriminatory behaviour.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">9. BTG&rsquo;s Responsibilities</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>BTG operates and maintains the Platform, processes payments, provides customer support, and markets your treks.</li>
                        <li>BTG supplies you with a personal QR code, shareable review cards, and social media tools to promote your profile and treks.</li>
                        <li>BTG handles data privacy per its Privacy Policy. You agree to use Traveller contact details only for the purpose of fulfilling the booking.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">10. Intellectual Property</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>BTG&rsquo;s name, logo, and platform design are its exclusive property.</li>
                        <li>You grant BTG a licence to use your content (photos, text) for marketing. You warrant that you own the rights or have permission to use any content you upload.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">11. Indemnification</h4>
                      <p className="text-xs">You agree to indemnify, defend, and hold harmless BTG, its officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in connection with: your breach of any provision of this Agreement; your provision of a Trek Experience (including any injury, death, property damage, or legal violation); any inaccurate, false, or misleading information provided by you; any dispute between you and a Traveller or third party; your violation of any applicable law, regulation, or third‑party rights.</p>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">12. Force Majeure</h4>
                      <p className="text-xs">Neither party shall be liable for any failure or delay in performing its obligations under this Agreement if caused by circumstances beyond its reasonable control, including acts of God, natural disasters, war, civil unrest, terrorism, pandemics, government orders, strikes, or severe weather conditions that make a trek unsafe. If the force majeure event continues for more than 30 days, either party may terminate without liability.</p>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">13. Termination</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You may terminate by giving written notice; your profile will be deactivated within 7 days.</li>
                        <li>BTG may terminate immediately if you violate this Agreement, pose a safety risk, engage in fraud, or lose required certifications.</li>
                        <li>Upon termination, any pending Earnings are paid within 30 days, subject to deductions for liabilities.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">14. Limitation of Liability</h4>
                      <p className="text-xs">To the maximum extent permitted by law, BTG shall not be liable for indirect or consequential damages arising from this Agreement. BTG&rsquo;s total liability shall not exceed the total Commission paid by you in the 12 months preceding the claim.</p>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">15. Dispute Resolution and Governing Law</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>This Agreement is governed by the laws of India.</li>
                        <li>Any dispute shall be resolved by arbitration in English, with a sole arbitrator mutually appointed.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">16. Amendments</h4>
                      <p className="text-xs">BTG may update this Agreement with 7 days&rsquo; notice. Continued use after the effective date constitutes acceptance.</p>

                      <p className="text-xs font-semibold mt-3">By checking the &ldquo;I agree&rdquo; box, you confirm that you have read, understood, and agree to these Terms &amp; Conditions.</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-gray-900 text-base mb-1">BOOK THE GUIDE – ADVENTURE GUIDE AGREEMENT AND TERMS &amp; CONDITIONS</h3>
                      <p className="text-xs text-gray-500 mb-3">Category: Adventure Guide &bull; Commission: 20%</p>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">1. Definitions</h4>
                      <ul className="list-disc pl-5 space-y-0.5 text-xs">
                        <li>&ldquo;Platform&rdquo; – BTG&rsquo;s website, app, and related services.</li>
                        <li>&ldquo;Adventure Experience&rdquo; – Any guided adventure sport or activity listed by you (including but not limited to rafting, paragliding, climbing, bungee, etc.).</li>
                        <li>&ldquo;Traveller&rdquo; – Any person who books an Adventure Experience through the Platform.</li>
                        <li>&ldquo;Booking&rdquo; – A confirmed reservation.</li>
                        <li>&ldquo;Commission&rdquo; – 20% of the total Booking value (unless otherwise specified in a promotional period).</li>
                        <li>&ldquo;Earnings&rdquo; – Total Booking value minus Commission and applicable taxes.</li>
                      </ul>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">2. Eligibility and Registration</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You must be at least 18 years old and legally permitted to guide adventure activities in your location.</li>
                        <li>You must hold valid adventure‑specific certifications relevant to the activities you offer (e.g., River rafting: Raft Guide certification from IISM or equivalent; Paragliding: Pilot/tandem license from DGCA or recognised body; Bungee jumping: Certified operator training; Rock climbing/mountaineering: NIMAS, AIMA, or equivalent).</li>
                        <li>You must provide proof of professional liability insurance covering adventure sports activities, with coverage adequate for the risks involved. BTG may request proof before approving your profile.</li>
                        <li>You agree to provide accurate identification (Aadhaar) and a clear profile photo. BTG reserves the right to verify your certifications and insurance with issuing authorities.</li>
                        <li>Your profile and Adventure Experience listings are subject to approval. BTG may reject or remove listings that do not meet safety, quality, or legal standards.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">3. Package Details Accuracy and No False Information</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You represent and warrant that all information provided in your Adventure Experience listings (including but not limited to activity description, risks, physical requirements, safety equipment provided, certifications held, age/health restrictions, inclusions, exclusions) is true, accurate, and not misleading.</li>
                        <li>You shall not exaggerate, omit material safety information, or make false claims about the activity, the risks, the equipment, or your qualifications.</li>
                        <li>Any Traveller complaint arising from inaccurate or false information may result in suspension of your profile, withholding of payments, and permanent removal from the Platform.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">4. Listing Adventure Experiences</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You create listings via your Guide Dashboard. Each Adventure Experience must include: clear description of the activity, risks, and physical requirements; safety equipment provided; required certifications for the guide; age and health restrictions for travellers; inclusions and exclusions.</li>
                        <li>You retain ownership of your photos and descriptions, but grant BTG a non‑exclusive, royalty‑free licence to use them for promotion.</li>
                        <li>Safety Compliance: You must comply with all applicable safety regulations, including the Adventure Tourism guidelines issued by the Ministry of Tourism (India) and local authorities.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">5. Pricing and Payment</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You set the price for each Adventure Experience. The price displayed on the Platform is the total amount payable by the Traveller, inclusive of all taxes and fees.</li>
                        <li>BTG collects the full payment from the Traveller at the time of booking. BTG deducts its Commission and remits the balance to you as Earnings.</li>
                        <li>You agree that you will not charge Travellers any additional fees outside the Platform unless agreed in writing and disclosed in the listing.</li>
                        <li>Payout: Your Earnings are paid within 3 business days after the adventure is completed, provided no dispute exists. Payouts are made to your bank account or UPI.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">6. Bookings and Commission</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>When a Traveller books an Adventure Experience, BTG sends you a WhatsApp notification. You must contact the Traveller within 4 hours to confirm the booking, go over safety instructions, and obtain any necessary waivers.</li>
                        <li>All payments are processed by BTG. The Traveller pays the full amount at booking.</li>
                        <li>Commission: BTG deducts 20% of the total Booking value. First 60 days from profile go‑live: Commission reduced to 15%. BTG Select Badge: After completing 10 Adventures through BTG, your commission reduces to 17% permanently.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">7. Cancellations and Refunds</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You define a cancellation policy for each adventure. BTG administers refunds according to that policy. For adventures dependent on weather or river conditions, you must specify conditions under which cancellations are fully refunded.</li>
                        <li>If you cancel a confirmed adventure (except for genuine emergencies or force majeure), BTG may deduct the Commission from your future earnings as a penalty and/or suspend or remove your profile.</li>
                        <li>Disputes over cancellations or quality of service are resolved by BTG, whose decision is final. BTG may withhold payout until resolution.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">8. Your Responsibilities as an Adventure Guide</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>Safety and Conduct: You are solely responsible for the safety of Travellers during the adventure. You must conduct a safety briefing before the activity, ensure all participants use proper safety gear, and adhere to industry best practices.</li>
                        <li>Equipment: You must provide well‑maintained, certified equipment appropriate for the activity. Any equipment failure resulting in injury or damage will be your responsibility.</li>
                        <li>Certifications and Insurance: You must keep all adventure‑specific certifications current. Failure to do so will result in immediate suspension. You must maintain professional liability insurance with adequate coverage per event.</li>
                        <li>Waivers: You must obtain signed (or digitally acknowledged) liability waivers from each Traveller before the activity, clearly stating the risks involved.</li>
                        <li>Prohibited Conduct: You shall not solicit bookings outside the Platform, misrepresent activity difficulty or risks, or engage in any unsafe or discriminatory behaviour.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">9. BTG&rsquo;s Responsibilities</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>BTG operates and maintains the Platform, processes payments, provides customer support, and markets your adventure experiences.</li>
                        <li>BTG supplies you with a personal QR code, shareable review cards, and social media tools to promote your profile and activities.</li>
                        <li>BTG handles data privacy per its Privacy Policy. You agree to use Traveller contact details only for the purpose of fulfilling the booking.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">10. Intellectual Property</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>BTG&rsquo;s name, logo, and platform design are its exclusive property.</li>
                        <li>You grant BTG a licence to use your content (photos, text) for marketing. You warrant that you own the rights or have permission to use any content you upload.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">11. Indemnification</h4>
                      <p className="text-xs">You agree to indemnify, defend, and hold harmless BTG, its officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in connection with: your breach of any provision of this Agreement; your provision of an Adventure Experience (including any injury, death, property damage, or legal violation); any inaccurate, false, or misleading information provided by you; any dispute between you and a Traveller or third party; your violation of any applicable law, regulation, or third‑party rights.</p>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">12. Force Majeure</h4>
                      <p className="text-xs">Neither party shall be liable for any failure or delay in performing its obligations under this Agreement if caused by circumstances beyond its reasonable control, including acts of God, natural disasters, war, civil unrest, terrorism, pandemics, government orders, strikes, or adverse weather/river conditions that make the adventure unsafe. If the force majeure event continues for more than 30 days, either party may terminate without liability.</p>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">13. Termination</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>You may terminate by giving written notice; your profile will be deactivated within 7 days.</li>
                        <li>BTG may terminate immediately if you violate this Agreement, pose a safety risk, engage in fraud, or lose required certifications or insurance.</li>
                        <li>Upon termination, any pending Earnings are paid within 30 days, subject to deductions for liabilities.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">14. Limitation of Liability</h4>
                      <p className="text-xs">To the maximum extent permitted by law, BTG shall not be liable for indirect or consequential damages arising from this Agreement. BTG&rsquo;s total liability shall not exceed the total Commission paid by you in the 12 months preceding the claim.</p>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">15. Dispute Resolution and Governing Law</h4>
                      <ol className="list-decimal pl-5 space-y-0.5 text-xs">
                        <li>This Agreement is governed by the laws of India.</li>
                        <li>Any dispute shall be resolved by arbitration in English, with a sole arbitrator mutually appointed.</li>
                      </ol>

                      <h4 className="font-semibold text-gray-800 mt-3 mb-1">16. Amendments</h4>
                      <p className="text-xs">BTG may update this Agreement with 7 days&rsquo; notice. Continued use after the effective date constitutes acceptance.</p>

                      <p className="text-xs font-semibold mt-3">By checking the &ldquo;I agree&rdquo; box, you confirm that you have read, understood, and agree to these Terms &amp; Conditions.</p>
                    </div>
                  )}
                </div>
              </>
            )}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.termsAccepted} onChange={(e) => setForm(prev => ({ ...prev, termsAccepted: e.target.checked }))} className="mt-0.5 w-4 h-4 text-btg-terracotta border-gray-300 rounded focus:ring-btg-terracotta/40" />
              <span className="text-sm text-gray-700">
                I have read and agree to the <strong>Trek Guide Agreement</strong> and <strong>Adventure Guide Agreement</strong> Terms &amp; Conditions of Book The Guide. I confirm that all information provided is accurate.
              </span>
            </label>
            {!form.termsAccepted && <p className="text-xs text-red-500">You must accept terms and conditions to save your profile</p>}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={loading} size="lg">Save Profile</Button>
        </div>
      </form>
    </div>
  );
}
