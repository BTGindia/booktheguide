'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Welcome back!');
        // Role-based redirect
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        const role = session?.user?.role;
        let redirectTo = callbackUrl;
        if (callbackUrl === '/' || !callbackUrl) {
          switch (role) {
            case 'GUIDE': redirectTo = '/dashboard/guide'; break;
            case 'ADMIN': redirectTo = '/dashboard/admin'; break;
            case 'SUPER_ADMIN': redirectTo = '/dashboard/super-admin'; break;
            case 'UI_MANAGER': redirectTo = '/dashboard/ui-manager'; break;
            case 'GUIDE_MANAGER': redirectTo = '/dashboard/guide-manager'; break;
            case 'CUSTOMER': redirectTo = '/dashboard/customer'; break;
            default: redirectTo = '/';
          }
        }
        router.push(redirectTo);
        router.refresh();
      }
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
            <img src="/images/btg-logo.png" alt="Book The Guide" className="h-10 object-contain" />
          </Link>
          <h1 className="font-heading text-2xl font-normal text-btg-dark">
            Welcome Back
          </h1>
          <p className="text-btg-light-text mt-1 text-sm">
            Sign in to your Book The Guide account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[20px] border border-btg-sand shadow-lg p-8 space-y-5">
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <div className="relative">
            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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

          <Button
            type="submit"
            isLoading={loading}
            className="w-full !bg-[#58bdae] hover:!bg-[#4aa99b] !rounded-full"
            size="lg"
          >
            Sign In
          </Button>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-[#58bdae] font-medium hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>

        <p className="text-center text-sm text-btg-mid mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#58bdae] font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
        <p className="text-center text-sm text-btg-mid mt-2">
          Want to become a guide?{' '}
          <Link href="/register?role=guide" className="text-[#58bdae] font-semibold hover:underline">
            Register as Guide
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p>Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}