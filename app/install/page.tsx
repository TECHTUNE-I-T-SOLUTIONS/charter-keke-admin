'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, Smartphone, CheckCircle, Apple, HardDrive, Wifi } from 'lucide-react';
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
        
        const response = await fetch('/api/app/releases?limit=1', {
          method: 'GET',
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

  const getDownloadLink = () => {
    if (!latestRelease) return null;

    const apkAsset = latestRelease.assets.find((a) => a.name.endsWith('.apk'));
    const iosAsset = latestRelease.assets.find((a) => a.name.endsWith('.ipa'));
    const assetToDownload = apkAsset || iosAsset;

    if (!assetToDownload) return null;

    // Build download URL with proper encoding
    const params = new URLSearchParams();
    params.append('assetUrl', assetToDownload.downloadUrl);
    params.append('fileName', assetToDownload.name);

    return `/api/app/downloads?${params.toString()}`;
  };

  const downloadLink = getDownloadLink();
  const appQRUrl = 'https://charterkeke.vercel.app/app/install';

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#052659]/10 to-[#4353a4]/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#052659]/10 mb-6">
              <Smartphone className="h-4 w-4 text-[#052659] dark:text-[#1FABFCFF]" />
              <span className="text-sm font-medium text-[#052659] dark:text-[#1FABFCFF]">
                Download Charter Keke
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              Get the Charter Keke App
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Experience safe, affordable, and convenient keke rides on your terms. Available on
              Android and iOS platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Main Download Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            {/* Left: Download Info */}
            <div>
              <h2 className="text-3xl font-bold mb-6">
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
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-600 font-semibold">
                        Latest Version: v{latestRelease.version}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      Updated:{' '}
                      {new Date(latestRelease.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>

                    {latestRelease.releaseNotes && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                          What's New:
                        </h3>
                        <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                          {latestRelease.releaseNotes.substring(0, 200)}
                          {latestRelease.releaseNotes.length > 200 ? '...' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              {/* Features */}
              <div className="space-y-4 mb-8">
                <h3 className="font-semibold text-lg mb-4">Why Choose Charter Keke?</h3>
                {[
                  'Book private, comfortable rides instantly',
                  'Transparent pricing with no hidden charges',
                  'Real-time tracking for safety and security',
                  'Experienced and verified drivers',
                  'Emergency contact sharing features',
                  'Seamless payment integration',
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-300">{feature}</p>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              {downloadLink && latestRelease && (
                <a href={downloadLink} download={`charter-keke-${latestRelease.version}.apk`}>
                  <Button size="lg" className="w-full bg-[#052659] hover:bg-[#041d40] text-white dark:bg-[#1FABFCFF] dark:hover:bg-[#1a9ad9]">
                    <Download className="mr-2 h-5 w-5" />
                    Download APK
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
                Or scan the QR code with your mobile device
              </p>
            </div>

            {/* Right: QR Code & Visual */}
            <div className="flex flex-col items-center justify-center">
              {/* QR Code Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 w-full max-w-sm">
                <div className="flex flex-col items-center">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(appQRUrl)}`}
                      alt="Download Charter Keke App QR Code"
                      width={256}
                      height={256}
                      className="rounded"
                    />
                  </div>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Scan to download on any device
                  </p>
                </div>
              </div>

              {/* System Requirements */}
              <div className="mt-8 w-full space-y-3">
                <h3 className="font-semibold text-center">System Requirements</h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span><strong>Android:</strong> Version 8.0 or higher</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Apple className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span><strong>iOS:</strong> Version 14.0 or higher</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span><strong>Storage:</strong> At least 100 MB free space</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span><strong>Connection:</strong> Active internet required</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900">
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
                  'Click the download button above or scan the QR code with your phone to download the APK file.',
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
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-[#052659] dark:bg-[#1FABFCFF] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
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
          <h2 className="text-3xl font-bold text-center mb-12">
            Troubleshooting
          </h2>

          <div className="max-w-2xl mx-auto space-y-6">
            {[
              {
                question: 'The app won\'t install on my device',
                answer:
                  'Make sure your device meets the minimum system requirements (Android 8.0+ or iOS 14.0+) and has at least 100 MB of free storage space. You may also need to enable installation from unknown sources in your device settings.',
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
              <div key={index} className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.answer}</p>
              </div>
            ))}

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Still need help?
              </h3>
              <p className="text-blue-800 dark:text-blue-300 mb-4">
                Contact our support team for assistance with installation or any other issues.
              </p>
              <Link href="/help">
                <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#052659] to-[#4353a4] dark:bg-gradient-to-r dark:from-[#1FABFCFF] dark:to-[#6483B9FF]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience Better Rides?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Download Charter Keke today and join thousands of satisfied riders enjoying safe,
              affordable transportation.
            </p>
            {downloadLink && (
              <a href={downloadLink} download>
                <Button size="lg" className="bg-white text-[#052659] hover:bg-white/90 dark:bg-white dark:text-[#1FABFCFF]">
                  Get the App Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
