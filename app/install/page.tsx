'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, Smartphone, CheckCircle, Apple, HardDrive, Wifi, SmartphoneNfc, TabletSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

interface AppRelease {
  version: string;
  name: string;
  releaseNotes: string;
  publishedAt: string;
  assets: Array<{
    name: string;
    downloadUrl: string;
  }>;
}

export default function AppInstallPage() {
  const [latestRelease, setLatestRelease] = useState<AppRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestRelease = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add cache-busting query parameter to force fresh data
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/app/releases?limit=1&t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setLatestRelease(data[0]);
        } else if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching releases:', err);
        setError(
          'Unable to fetch latest version. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLatestRelease();
  }, []);

  const androidAsset = latestRelease?.assets.find((a) => a.name.endsWith('.apk')) || null;
  const iosAsset = latestRelease?.assets.find((a) => a.name.endsWith('.ipa')) || null;
  const androidDownloadLink = androidAsset
    ? `/api/app/download/${latestRelease?.version}/${androidAsset.name}`
    : null;
  const iosDownloadLink = iosAsset
    ? `/api/app/download/${latestRelease?.version}/${iosAsset.name}`
    : null;
  const appQRUrl = 'https://charterkeke.vercel.app/app/install';

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden max-w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF9203]/10 to-[#C57711]/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF9203]/10 dark:bg-[#633B06]/20 mb-6">
              <Smartphone className="h-4 w-4 text-[#814B05] dark:text-[#E4C9A5]" />
              <span className="text-sm font-medium text-[#663C05] dark:text-[#FFE4C0]">
                Download Charter Keke
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance text-[#FF9203] dark:text-[#FFE7C7]">
              Get the Charter Keke App
            </h1>
            <p className="text-lg text-orange4600 dark:text-orange-100 mb-8 max-w-2xl mx-auto">
              Experience safe, affordable, and convenient keke rides on your terms. Available on
              Android and iOS platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Main Download Section */}
      <section className="py-12 md:py-20 max-w-full">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            {/* Left: Download Info */}
            <div>
              <h2 className="text-3xl font-bold mb-6 text-[#FF9203] dark:text-[#FFE7C7]">
                Download Charter Keke Today
              </h2>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              ) : latestRelease ? (
                <>
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-200" />
                      <span className="text-orange-600 dark:text-orange-200 font-semibold">
                        Latest Version: v{latestRelease.version}
                      </span>
                    </div>
                    <p className="text-orange-600 dark:text-orange-200 text-sm mb-4">
                      Updated:{' '}
                      {new Date(latestRelease.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>

                    {latestRelease.releaseNotes && (
                      <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-3">
                          What's New:
                        </h3>
                        <div className="text-orange-800 dark:text-orange-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {latestRelease.releaseNotes}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              {/* Features */}
              <div className="space-y-4 mb-8">
                <h3 className="font-semibold text-lg mb-4 text-[#FF9203] dark:text-[#FFE7C7]">
                  Why Choose Charter Keke?
                </h3>
                {[
                  'Book private, comfortable rides instantly',
                  'Transparent pricing with no hidden charges',
                  'Real-time tracking for safety and security',
                  'Experienced and verified drivers',
                  'Emergency contact sharing features',
                  'Seamless payment integration',
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-200 mt-0.5 flex-shrink-0" />
                    <p className="text-orange-700 dark:text-orange-200">{feature}</p>
                  </div>
                ))}
              </div>

              {/* Download Buttons */}
              {latestRelease && (androidDownloadLink || iosDownloadLink) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {androidDownloadLink && (
                    <a
                      href={androidDownloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="lg" className="w-full bg-[#FF9203] hover:bg-[#8D5308] text-white dark:bg-[#2C1F0F] dark:hover:bg-[#694C25]">
                        <SmartphoneNfc className="mr-2 h-5 w-5" />
                        Download Android APK
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  )}

                  {iosDownloadLink && (
                    <a
                      href={iosDownloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="lg" variant="outline" className="w-full border-[#FF9203] text-[#C57711] hover:bg-[#FF9203]/10 dark:border-[#FFE7C7] dark:text-[#FFE7C7] dark:hover:bg-[#FFE7C7]/10">
                        <TabletSmartphone className="mr-2 h-5 w-5" />
                        Download iOS IPA
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              )}

              <p className="text-sm text-orange-600 dark:text-orange-100 text-center mt-4">
                Or scan the QR code with your mobile device
              </p>
            </div>

            {/* Right: QR Code & Visual */}
            <div className="flex flex-col items-center justify-center">
              {/* QR Code Card */}
              <div className="bg-white dark:bg-orange-900 rounded-2xl shadow-lg p-8 w-full max-w-sm">
                <div className="flex flex-col items-center">
                  <div className="bg-orange-100 dark:bg-orange-800 rounded-xl p-6 mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(appQRUrl)}`}
                      alt="Download Charter Keke App QR Code"
                      width={256}
                      height={256}
                      className="rounded"
                    />
                  </div>
                  <p className="text-center text-sm text-orange-600 dark:text-orange-100 mb-4">
                    Scan to download on any device
                  </p>
                </div>
              </div>

              {/* System Requirements */}
              <div className="mt-8 w-full space-y-3">
                <h3 className="font-semibold text-center text-[#FF9203] dark:text-[#FFE7C7]">
                  System Requirements
                </h3>
                <div className="space-y-2 text-sm text-orange-600 dark:text-orange-100">
                  <p className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-orange-600 dark:text-orange-200" />
                    <span><strong>Android:</strong> Version 8.0 or higher</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Apple className="w-4 h-4 text-orange-600 dark:text-orange-200" />
                    <span><strong>iOS:</strong> Version 14.0 or higher</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-orange-600 dark:text-orange-200" />
                    <span><strong>Storage:</strong> At least 100 MB free space</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-orange-600 dark:text-orange-200" />
                    <span><strong>Connection:</strong> Active internet required</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-12 md:py-20 bg-orange-50 dark:bg-[#4E2D01]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Installation Guide
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                title: 'Download',
                description:
                    'Click the Android or iOS download button above, or scan the QR code with your phone to open the install page.',
              },
              {
                step: '2',
                title: 'Install',
                description:
                  'Open the downloaded file and follow the installation prompts. Grant necessary permissions when asked.',
              },
              {
                step: '3',
                title: 'Launch',
                description:
                  'Open the app, create or log in to your account, and start booking your first ride!',
              },
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-[#B167066C] rounded-xl p-6 text-center shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-[#FF9203] dark:bg-[#C27107] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-orange-600 dark:text-orange-100 text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#FF9203] dark:text-[#FFE7C7]">
            Troubleshooting
          </h2>

          <div className="max-w-2xl mx-auto space-y-6">
            {[
              {
                question: 'The app won\'t install on my device',
                answer:
                  'Make sure your device meets the minimum system requirements (Android 8.0+ or iOS 14.0+) and has at least 100 MB of free storage space. Android users may need to enable installation from unknown sources in device settings.',
              },
              {
                question: 'How do I update the app?',
                answer:
                  'You can check for updates directly in the app from the Profile screen by tapping "Check for Updates". The app will also notify you when new versions are available.',
              },
              {
                question: 'I\'ve lost my password',
                answer:
                  'Open the app and tap "Forgot Password" on the login screen. Enter your email or phone number and follow the recovery instructions sent to you.',
              },
              {
                question: 'The app keeps crashing',
                answer:
                  'Try uninstalling and reinstalling the app. Make sure you have the latest version and sufficient storage space on your device. contact support if issues persist.',
              },
            ].map((item, index) => (
              <div key={index} className="border border-orange-200 dark:border-orange-800 rounded-lg p-6 bg-orange-50 dark:bg-[#4E2D01] hover:bg-orange-100 dark:hover:bg-[#5E3A01] transition-colors">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-orange-600 dark:text-orange-100">{item.answer}</p>
              </div>
            ))}

            <div className="bg-orange-50 dark:bg-[#AC6303] border border-orange-200 dark:border-orange-800 rounded-lg p-6 mt-8">
              <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">
                Still need help?
              </h3>
              <p className="text-orange-600 dark:text-orange-100 mb-4">
                Contact our support team for assistance with installation or any other issues.
              </p>
              <Link href="/help">
                <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#AF6401] to-[#FF9203] dark:bg-gradient-to-r dark:from-[#CF7704] dark:to-[#442803]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience Better Rides?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Download Charter Keke today and join thousands of satisfied riders enjoying safe,
              affordable transportation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {androidDownloadLink && (
                <a href={androidDownloadLink} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-[#271906] hover:bg-white/90 dark:bg-white dark:text-[#241401] dark:hover:bg-white/90">
                    <SmartphoneNfc className="mr-2 h-4 w-4" />
                    Get Android APK
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
              {iosDownloadLink && (
                <a href={iosDownloadLink} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 dark:border-white dark:text-white dark:hover:bg-white/10">
                    <TabletSmartphone className="mr-2 h-4 w-4" />
                    Get iOS IPA
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
