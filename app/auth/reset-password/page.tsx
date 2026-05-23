'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthDownloadCard } from '@/components/auth-download-card';
import { toast } from 'sonner';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const phoneNumber = searchParams.get('phone_number') || searchParams.get('phone');
  const method = searchParams.get('method');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(!!token);
  const [isValid, setIsValid] = useState(!token);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) return;

      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (!response.ok || !data.valid) {
          throw new Error(data.error || 'Invalid or expired token');
        }

        setIsValid(true);
      } catch (error) {
        setIsValid(false);
        toast.error('Reset link invalid', {
          description: error instanceof Error ? error.message : 'Please request a new password reset link.',
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(token ? '/api/auth/reset-password' : '/api/auth/reset-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          token
            ? { token, password }
            : email
              ? { email, newPassword: password, method }
              : { phone_number: phoneNumber, newPassword: password, method }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success('Password updated', {
        description: 'You can now sign in with your new password.',
      });

      setTimeout(() => router.push('/auth/login'), 1800);
    } catch (error) {
      toast.error('Reset failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FF9203]/5 via-white to-[#C57711]/10 px-4">
        <Card className="w-full max-w-md border-orange-200/70 shadow-2xl shadow-orange-200/20 dark:border-orange-900/40">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (token && !isValid) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#FF9203]/5 via-white to-[#C57711]/10 px-4 py-8 md:py-12 flex items-center justify-center">
        <Card className="w-full max-w-md border-orange-200/70 shadow-2xl shadow-orange-200/20 dark:border-orange-900/40">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-950/30 dark:text-red-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle>Reset link invalid</CardTitle>
            <CardDescription>Your password reset link is invalid or expired. Request a new one.</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild className="w-full bg-[#FF9203] text-white hover:bg-[#E68900]">
              <Link href="/auth/forgot-password">Request new link</Link>
            </Button>
            <Link href="/auth/login" className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FF9203]/5 via-white to-[#C57711]/10 px-4 py-8 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="border-orange-200/70 shadow-2xl shadow-orange-200/20 dark:border-orange-900/40">
          <CardHeader className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 self-center sm:self-start rounded-full bg-[#FF9203]/10 px-4 py-2 text-sm font-semibold text-[#8D5308] dark:bg-[#633B06]/20 dark:text-[#FFE4C0]">
              <ShieldCheck className="h-4 w-4" />
              Secure password reset
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-[#7A4603] dark:text-[#FFE7C7]">Set a new password</CardTitle>
              <CardDescription className="mt-2 text-base text-orange-700/80 dark:text-orange-100/80">
                {token
                  ? 'Use the link from your email to reset your password.'
                  : 'You verified your OTP successfully. Now choose a new password for your account.'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 pl-10 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-12 pl-10 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-sm text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-100">
                Choose a strong password you haven’t used before. This keeps your web and mobile account secure.
              </div>

              <Button type="submit" className="h-12 w-full bg-[#FF9203] text-white hover:bg-[#E68900]" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Update password'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              Home
            </Link>
          </CardFooter>
        </Card>

        <AuthDownloadCard
          title="Keep using the app"
          description="After resetting your password, open the app to continue with live ride tracking and instant notifications."
        />
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}