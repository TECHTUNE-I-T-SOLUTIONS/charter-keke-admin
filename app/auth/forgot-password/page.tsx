'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, MessageSquareText, Smartphone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthDownloadCard } from '@/components/auth-download-card';
import { toast } from 'sonner';

type Method = 'email' | 'sms';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState<Method>('email');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState<'request' | 'verify' | 'done'>('request');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier) {
      toast.error('Enter your email address or phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEmail = identifier.includes('@');

      if (method === 'email') {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(isEmail ? { email: identifier } : { phone_number: identifier }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send reset link');
        }

        toast.success('Reset link sent', {
          description: 'Check your email for the password recovery link.',
        });
        setStage('done');
        return;
      }

      const response = await fetch('/api/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEmail ? { email: identifier, type: 'forgot_password' } : { phone_number: identifier, type: 'forgot_password' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      toast.success('OTP sent', {
        description: 'Enter the code from your SMS to continue.',
      });
      setStage('verify');
    } catch (error) {
      toast.error('Recovery request failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!otp) {
      toast.error('Enter the OTP sent to your phone.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEmail = identifier.includes('@');
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEmail
            ? { code: otp, email: identifier, type: 'forgot_password' }
            : { code: otp, phone_number: identifier, type: 'forgot_password' }
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      toast.success('OTP verified', { description: 'You can now set a new password.' });
      router.push(
        `/auth/reset-password?${isEmail ? 'email' : 'phone_number'}=${encodeURIComponent(identifier)}&method=sms`
      );
    } catch (error) {
      toast.error('OTP verification failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FF9203]/5 via-white to-[#C57711]/10 px-4 py-8 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="border-orange-200/70 shadow-2xl shadow-orange-200/20 dark:border-orange-900/40">
          <CardHeader className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 self-center sm:self-start rounded-full bg-[#FF9203]/10 px-4 py-2 text-sm font-semibold text-[#8D5308] dark:bg-[#633B06]/20 dark:text-[#FFE4C0]">
              <ShieldCheck className="h-4 w-4" />
              Password recovery
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-[#7A4603] dark:text-[#FFE7C7]">Recover your account</CardTitle>
              <CardDescription className="mt-2 text-base text-orange-700/80 dark:text-orange-100/80">
                Choose email recovery for a reset link or SMS recovery for an OTP you can verify before setting a new password.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {stage === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or phone number</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="identifier"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="name@example.com or 080..."
                      className="h-12 pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Recovery method</Label>
                  <select
                    id="method"
                    value={method}
                    onChange={(event) => setMethod(event.target.value as Method)}
                    aria-label="Recovery method"
                    title="Recovery method"
                    className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="email">Send recovery link to email</option>
                    <option value="sms">Send OTP by SMS</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-sm text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-100">
                  Email recovery sends a reset link. SMS recovery sends an OTP that you verify before setting a new password.
                </div>

                <Button type="submit" className="h-12 w-full bg-[#FF9203] text-white hover:bg-[#E68900]" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : method === 'email' ? 'Send recovery link' : 'Send SMS OTP'}
                </Button>
              </form>
            )}

            {stage === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <div className="relative">
                    <MessageSquareText className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      placeholder="Enter the 6-digit code"
                      className="h-12 pl-10"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-sm text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-100">
                  We sent an OTP to your recovery destination. Verify it here to unlock the password reset page.
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="h-12 flex-1" onClick={() => setStage('request')} disabled={isSubmitting}>
                    Back
                  </Button>
                  <Button type="submit" className="h-12 flex-1 bg-[#FF9203] text-white hover:bg-[#E68900]" disabled={isSubmitting}>
                    {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              </form>
            )}

            {stage === 'done' && (
              <div className="space-y-4 text-center sm:text-left">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-100">
                  If the account exists, a recovery email has been sent. Open the link in your inbox to set a new password.
                </div>
                <Button asChild className="h-12 w-full bg-[#FF9203] text-white hover:bg-[#E68900]">
                  <Link href="/auth/login">Back to login</Link>
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Smartphone className="h-4 w-4" />
              Go home
            </Link>
          </CardFooter>
        </Card>

        <AuthDownloadCard
          title="Need the app as well?"
          description="Download the app to keep tracking, payments, and notifications in one place after you recover your account."
        />
      </div>
    </main>
  );
}
