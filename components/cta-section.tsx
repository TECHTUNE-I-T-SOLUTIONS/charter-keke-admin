"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Hourglass } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#AF6401] to-[#EE8906] dark:bg-gradient-to-r dark:from-[#C47003] dark:to-[#8D550B] p-12 md:p-16">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 mb-6">
              <Hourglass className="h-4 w-4" />
              <span className="text-sm font-medium">Introducing our mobile app</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">Ready to Save on Your Daily Commute?</h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Charter Keke today and reduce the stress of having to wait under the sun on queues and signup using your referral code!
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="bg-white text-[#693E06] hover:bg-white/90 group">
                  Sign Up Now
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 bg-transparent dark:text-white"
                >
                  Drive with Us
                </Button>
              </Link>
              <Link href="/install">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 bg-transparent dark:text-white"
                >
                  Download App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
