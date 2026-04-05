'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    // Simulate API call (real implementation would call /api/auth/forgot-password)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="bg-btg-cream min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        {/* Back to login */}
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#6B6560] hover:text-[#58bdae] transition-colors mb-8 font-body">
          <ArrowLeft className="w-4 h-4" />
          Back to Log In
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#1A1A18]/[0.06]">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#58bdae]/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-[#58bdae]" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-[#1A1A18] mb-2">Forgot Password?</h1>
                <p className="text-sm text-[#6B6560] font-body">
                  Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A18] mb-1.5 font-body">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full h-12 px-4 rounded-xl bg-[#F5F0E8] border border-[#EDE8DF] text-sm focus:outline-none focus:ring-2 focus:ring-[#58bdae]/40 focus:border-[#58bdae] font-body"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full h-12 bg-[#58bdae] hover:bg-[#4aa99b] disabled:bg-[#EDE8DF] disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm font-heading"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-[#1A1A18] mb-2">Check Your Email</h2>
              <p className="text-sm text-[#6B6560] font-body mb-6">
                We&apos;ve sent a password reset link to <strong className="text-[#1A1A18]">{email}</strong>. 
                Please check your inbox and follow the instructions.
              </p>
              <p className="text-xs text-[#6B6560] font-body">
                Didn&apos;t receive the email?{' '}
                <button onClick={() => setSubmitted(false)} className="text-[#58bdae] font-medium hover:underline">
                  Try again
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#6B6560] mt-6 font-body">
          Remember your password?{' '}
          <Link href="/login" className="text-[#58bdae] font-medium hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}
