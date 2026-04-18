'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: roleParam === 'guide' ? 'GUIDE' : 'CUSTOMER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-btg-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image src="/images/btg-logo.webp" alt="Book The Guide" width={120} height={40} className="h-10 w-auto object-contain" />
          </Link>
          <h1 className="font-heading text-2xl font-normal text-btg-dark">
            {form.role === 'GUIDE' ? 'Register as Guide' : 'Create Account'}
          </h1>
          <p className="text-btg-light-text mt-1 text-sm">
            {form.role === 'GUIDE'
              ? 'Join as a guide and start getting bookings'
              : 'Sign up to book amazing trips with local guides'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[20px] border border-btg-sand shadow-lg p-8 space-y-5">
          {/* Role Toggle */}
          <div className="flex bg-btg-sand rounded-full p-1">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, role: 'CUSTOMER' }))}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                form.role === 'CUSTOMER'
                  ? 'bg-[#58bdae] text-white shadow'
                  : 'text-btg-mid hover:text-btg-dark'
              }`}
            >
              Traveller
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, role: 'GUIDE' }))}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                form.role === 'GUIDE'
                  ? 'bg-[#58bdae] text-white shadow'
                  : 'text-btg-mid hover:text-btg-dark'
              }`}
            >
              Guide
            </button>
          </div>

          <Input
            id="name"
            name="name"
            label="Full Name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />

          <Input
            id="email"
            name="email"
            label="Email Address"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />

          <Input
            id="phone"
            name="phone"
            label="Phone Number"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
          />

          <div className="relative">
            <Input
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-btg-light-text hover:text-btg-mid"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            required
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full !bg-[#58bdae] hover:!bg-[#4aa99b] !rounded-full"
            size="lg"
          >
            {form.role === 'GUIDE' ? 'Register as Guide' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-btg-mid mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#58bdae] font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p>Loading...</p></div>}>
      <RegisterForm />
    </Suspense>
  );
}