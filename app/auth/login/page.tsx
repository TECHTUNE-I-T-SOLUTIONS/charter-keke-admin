'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthDownloadCard } from '@/components/auth-download-card';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier || !password) {
      toast.error('Please enter your email or phone number and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const credentials = identifier.includes('@')
        ? { email: identifier, password }
        : { phone: identifier, password };

      const result = await signIn('credentials', {
        ...credentials,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Login failed', { description: result.error });
        return;
      }

      const session = await fetch('/api/auth/session').then((response) => response.json());
      const role = session?.user?.role;

      toast.success('Welcome back', { description: 'Redirecting you to your dashboard.' });

      if (role === 'driver') {
        router.push('/driver/dashboard');
      } else if (role === 'admin' || role === 'super_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    } catch (error) {
      toast.error('Login failed', {
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
              Secure web login
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-[#7A4603] dark:text-[#FFE7C7]">Login to Charter Keke</CardTitle>
              <CardDescription className="mt-2 text-base text-orange-700/80 dark:text-orange-100/80">
                Use the web form to sign in, or download the mobile app if you want the full ride experience with live tracking and instant notifications.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/forgot-password" className="text-sm text-[#C57711] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    className="h-12 pl-10 pr-10"
                    autoComplete="current-password"
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

              <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 text-sm text-orange-900 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-100">
                Log in on web now, or open the app to keep your ride history, live tracking, and push notifications in one place.
              </div>

              <Button type="submit" className="h-12 w-full bg-[#FF9203] text-white hover:bg-[#E68900]" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in to web'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              New here?{' '}
              <Link href="/auth/register" className="font-semibold text-[#C57711] hover:underline">
                Create an account
              </Link>
            </p>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </CardFooter>
        </Card>

        <AuthDownloadCard
          title="Continue in the app"
          description="If you prefer a smoother mobile experience, download the app and continue with the same account there."
        />
      </div>
    </main>
  );
}
