"use client"

import React, { useState, useEffect } from "react";
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Users, Wallet, MapPin, GraduationCap } from "lucide-react"

export function HeroSection() {
  // Typing animation and mouse tracking state
  // const headlineRef = React.useRef<HTMLSpanElement>(null);

  // Typing animation and mouse tracking state
  const router = useRouter()

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background gradient (non-interactive) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF9101]/10 via-transparent to-[#633903]/20 dark:from-[#493317]/30 dark:to-[#633A06]/50 pointer-events-none" />

      <div className="container mx-auto px-4 py-12 md:py-24 max-w-full pr-8 pl-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
            >
              <Image src="/charter keke.png" alt="Charter Keke" width={48} height={48} className="rounded-lg" />
              <span className="text-sm font-medium text-foreground dark:text-white">Charter Keke - Tricycle Transport</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-balance text-foreground dark:text-white">
              Fast, Affordable Keke Rides
            </h1>
            <p className="text-lg text-muted-foreground dark:text-[#FDEDD8] mb-4 max-w-lg text-pretty">
              Charter Keke connects riders and drivers for affordable, safe tricycle rides across Debari, Shomolu, and Yaba. 
              Perfect for quick commutes, deliveries, and shared journeys.
            </p>

            <p className="text-lg text-primary font-semibold mb-4 max-w-lg text-pretty">
              Your trusted keke, booked in seconds
            </p>

            {/* Route Preview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-2 mb-8 p-3 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground dark:text-white">Debari / Shomolu</span>
              </div>
              <ArrowRight className="h-4 w-4 text-primary mx-2" />
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-secondary" />
                <span className="text-muted-foreground dark:text-white">Yaba / Your Destination</span>
              </div>
            </motion.div>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#FF9101] to-[#7A4704] dark:bg-gradient-to-r dark:from-[#F8AC49] dark:to-[#FCD19A] dark:text-black text-white hover:opacity-90 group animate-pulse-glow relative z-20 pointer-events-auto"
                onClick={() => router.push('/auth/register')}
              >
                Start Riding
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 bg-transparent relative z-20 pointer-events-auto text-[#462700] hover:bg-[#FF9101]/80 dark:text-white group animate-pulse-glow"
                onClick={() => router.push('/auth/register?type=driver')}
              >
                Become a Driver
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                whileHover={{ y: -4 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Verified</p>
                  <p className="text-xs text-muted-foreground dark:text-white">Riders</p>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -4 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-secondary/20">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Keke Network</p>
                  <p className="text-xs text-muted-foreground dark:text-white">Active Drivers</p>
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -4 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Fair Rates</p>
                  <p className="text-xs text-muted-foreground dark:text-white">No Surge Pricing</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Content - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Decorative circles */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-[#052659]/30 to-transparent rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#4353a4]/30 to-transparent rounded-full blur-3xl" />

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="relative"
              >
                <Image
                  src="/images/keke.png"
                  alt="Charter Keke - Tricycle illustration"
                  width={500}
                  height={300}
                  className="w-full max-w-lg drop-shadow-2xl"
                  priority
                />
              </motion.div>

              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
                className="absolute -top-4 -right-4 p-4 rounded-xl bg-card border border-border shadow-lg"
              >
                <p className="text-2xl font-bold text-primary dark:text-primary">Fast</p>
                <p className="text-xs text-muted-foreground">5-10 min pickup</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-8 -left-8 p-4 rounded-xl bg-card border border-border shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9101] to-[#834B03] border-2 border-card flex items-center justify-center text-white text-xs"
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium">+3 sharing</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
