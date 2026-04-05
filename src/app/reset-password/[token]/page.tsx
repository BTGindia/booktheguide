'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="bg-btg-cream min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#1A1A18]/[0.06]">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#58bdae]/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-[#58bdae]" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-[#1A1A18] mb-2">Reset Password</h1>
                <p className="text-sm text-[#6B6560] font-body">
                  Choose a new password for your account. Make sure it&apos;s at least 8 characters long.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A18] mb-1.5 font-body">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="w-full h-12 px-4 rounded-xl bg-[#F5F0E8] border border-[#EDE8DF] text-sm focus:outline-none focus:ring-2 focus:ring-[#58bdae]/40 focus:border-[#58bdae] font-body"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A18] mb-1.5 font-body">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    className="w-full h-12 px-4 rounded-xl bg-[#F5F0E8] border border-[#EDE8DF] text-sm focus:outline-none focus:ring-2 focus:ring-[#58bdae]/40 focus:border-[#58bdae] font-body"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 font-body">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#58bdae] hover:bg-[#4aa99b] disabled:bg-[#EDE8DF] disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm font-heading"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-[#1A1A18] mb-2">Password Reset!</h2>
              <p className="text-sm text-[#6B6560] font-body mb-6">
                Your password has been successfully reset. You can now log in with your new credentials.
              </p>
              <Link
                href="/login"
                className="inline-block text-sm font-bold text-white bg-[#58bdae] px-8 py-3 rounded-full hover:bg-[#4aa99b] transition-all font-heading"
              >
                Go to Log In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
