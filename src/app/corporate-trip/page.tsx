'use client';

import { useState, useEffect } from 'react';
import { Building2, School, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CorporateTripPage() {
  const [states, setStates] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    organizationType: 'corporate',
    organizationName: '',
    contactName: '',
    officialEmail: '',
    phone: '',
    groupSize: 20,
    preferredStateId: '',
    approxDays: 3,
    additionalNotes: '',
  });

  useEffect(() => {
    fetch('/api/geography/states')
      .then((r) => r.json())
      .then((data) => setStates(data.states || []))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organizationName.trim()) { toast.error('Organization name is required'); return; }
    if (!form.contactName.trim()) { toast.error('Contact name is required'); return; }
    if (!form.officialEmail.trim()) { toast.error('Official email is required'); return; }
    if (!form.phone.trim()) { toast.error('Phone number is required'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/corporate-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          groupSize: Number(form.groupSize),
          approxDays: Number(form.approxDays),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      toast.success('Inquiry submitted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit inquiry');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-btg-cream flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-[20px] shadow-lg border border-btg-sand p-8 text-center">
          <CheckCircle className="h-16 w-16 text-btg-sage mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-normal text-btg-dark mb-2">Thank You!</h2>
          <p className="text-btg-mid text-sm mb-6">
            Your trip inquiry has been submitted. Our team will reach out to you at{' '}
            <strong>{form.officialEmail}</strong> within 24-48 hours.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-btg-terracotta text-white rounded-full text-sm font-medium hover:bg-btg-rust transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-btg-cream">
      {/* Hero */}
      <div className="bg-btg-dark py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-btg-blush mb-3">Group Adventures</p>
          <h1 className="font-heading text-[clamp(28px,4vw,44px)] font-normal leading-[1.15] text-btg-cream mb-4">
            Plan Your Corporate or <em className="italic text-btg-blush">School Trip</em>
          </h1>
          <p className="text-btg-cream/50 text-base font-light">
            Let our expert team curate the perfect group adventure for your organization.
            Fill in the form below and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-16">
        <form onSubmit={handleSubmit} className="bg-white rounded-[20px] shadow-lg border border-btg-sand p-6 sm:p-8 space-y-6">
          {/* Organization Type Toggle */}
          <div>
            <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-2">Organization Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, organizationType: 'corporate' }))}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full border-2 font-medium text-sm transition-all ${
                  form.organizationType === 'corporate'
                    ? 'border-btg-terracotta bg-btg-blush/20 text-btg-terracotta'
                    : 'border-btg-sand text-btg-mid hover:border-btg-terracotta/40'
                }`}
              >
                <Building2 className="w-5 h-5" />
                Corporate
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, organizationType: 'school' }))}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full border-2 font-medium text-sm transition-all ${
                  form.organizationType === 'school'
                    ? 'border-btg-terracotta bg-btg-blush/20 text-btg-terracotta'
                    : 'border-btg-sand text-btg-mid hover:border-btg-terracotta/40'
                }`}
              >
                <School className="w-5 h-5" />
                School / College
              </button>
            </div>
          </div>

          {/* Org Name */}
          <div>
            <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">
              {form.organizationType === 'school' ? 'School / College Name' : 'Company Name'} *
            </label>
            <input
              type="text"
              name="organizationName"
              value={form.organizationName}
              onChange={handleChange}
              required
              placeholder={form.organizationType === 'school' ? 'e.g., Delhi Public School' : 'e.g., TCS, Infosys'}
              className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">Contact Person *</label>
              <input
                type="text"
                name="contactName"
                value={form.contactName}
                onChange={handleChange}
                required
                placeholder="Full Name"
                className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
              />
            </div>
          </div>

          {/* Official Email */}
          <div>
            <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">Official Email *</label>
            <input
              type="email"
              name="officialEmail"
              value={form.officialEmail}
              onChange={handleChange}
              required
              placeholder="name@company.com"
              className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
            />
            <p className="text-xs text-btg-light-text mt-1">Please use your official email (not Gmail / Yahoo)</p>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">Group Size *</label>
              <input
                type="number"
                name="groupSize"
                value={form.groupSize}
                onChange={handleChange}
                min={5}
                max={500}
                required
                className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">Approx. Days *</label>
              <input
                type="number"
                name="approxDays"
                value={form.approxDays}
                onChange={handleChange}
                min={1}
                max={30}
                required
                className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">Preferred State</label>
              <select
                name="preferredStateId"
                value={form.preferredStateId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-btg-sand rounded-full bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition appearance-none"
              >
                <option value="">Any / Undecided</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10.5px] font-semibold tracking-[0.15em] uppercase text-btg-mid mb-1.5">Additional Notes</label>
            <textarea
              name="additionalNotes"
              value={form.additionalNotes}
              onChange={handleChange}
              rows={4}
              placeholder="Any specific requirements, preferred activities, budget range, dates in mind..."
              className="w-full px-4 py-2.5 border border-btg-sand rounded-[16px] bg-btg-cream/50 text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-btg-terracotta text-white rounded-full text-sm font-medium hover:bg-btg-rust disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Inquiry'}
          </button>

          <p className="text-xs text-btg-light-text text-center">
            Your information is secure. We&apos;ll only use it to plan your trip.
          </p>
        </form>
      </div>
    </div>
  );
}
