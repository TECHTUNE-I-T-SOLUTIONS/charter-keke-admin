'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://charterkeke.vercel.app';
  const appQRUrl = `${baseUrl}/install`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FF9203]/5 to-[#C57711]/5 flex items-center justify-center py-8 md:py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF9203]/10 dark:bg-[#633B06]/20 mb-4">
            <CheckCircle className="h-4 w-4 text-[#814B05] dark:text-[#E4C9A5]" />
            <span className="text-sm font-medium text-[#663C05] dark:text-[#FFE4C0]">
              Download Charter Keke
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#FF9203] dark:text-[#FFE7C7] mb-3">
            Join Our Community
          </h1>
          <p className="text-orange-600 dark:text-orange-200 text-sm md:text-base max-w-lg mx-auto">
            Sign up as a rider or driver exclusively through our mobile app. Start your journey today!
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
          {/* Left: Features & CTA */}
          <div className="space-y-6">
            {/* Features */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg text-[#FF9203] dark:text-[#FFE7C7]">
                Sign Up Benefits
              </h2>
              {[
                'Safe and verified user community',
                'Instant account creation',
                'Seamless payment setup',
                'Referral rewards program',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-200 mt-1 flex-shrink-0" />
                  <p className="text-sm text-orange-700 dark:text-orange-200">{feature}</p>
                </div>
              ))}
            </div>

            {/* Download Button */}
            <a 
              href={(process.env.NEXT_PUBLIC_APP_BASE_URL || 'https://charterkeke.vercel.app') + '/install'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="w-full bg-[#FF9203] hover:bg-[#E68900] text-white dark:bg-[#C27107] dark:hover:bg-[#8D5308]">
                <Download className="mr-2 h-4 w-4" />
                Download App
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            </a>

            <p className="text-xs text-orange-600 dark:text-orange-100 text-center">
              Or scan the QR code →
            </p>
          </div>

          {/* Right: QR Code */}
          <div className="flex justify-center">
            <div className="bg-white dark:bg-[#2C1F0F] rounded-2xl shadow-lg p-4 md:p-6 w-full max-w-xs">
              <div className="bg-orange-100 dark:bg-orange-800 rounded-lg p-4 flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appQRUrl)}`}
                  alt="Download Charter Keke QR Code"
                  width={200}
                  height={200}
                  className="rounded"
                />
              </div>
              <p className="text-center text-xs text-orange-600 dark:text-orange-100 mt-3">
                Scan to download
              </p>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-orange-600 dark:text-orange-200">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold hover:underline">
              Download app to login
            </Link>
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs md:text-sm text-orange-600 dark:text-orange-200 hover:text-orange-700 dark:hover:text-orange-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
