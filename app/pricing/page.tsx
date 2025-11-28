"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Particles } from "@/components/particles"
import { Check, ArrowRight, MapPin, Users, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const routes = [
  {
    from: "Oke-Odo",
    to: "School Park",
    price: 700,
    duration: "15-20 min",
    popular: true,
  },
  {
    from: "School Park",
    to: "Oke-Odo",
    price: 700,
    duration: "15-20 min",
    popular: false,
  },
]

const benefits = [
  "No hidden fees",
  "Pay per seat and per trip depending on your choice",
  "Split costs with other students",
  "5% off when a student uses your referral code",
  "Secure Paystack payments",
  "Real-time price updates",
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Particles />
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <span className="text-sm font-medium">Transparent Pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple,{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Student-Friendly
              </span>{" "}
              Prices
            </h1>
            <p className="text-lg text-muted-foreground dark:text-white ">
              We keep it simple. Pay per seat, share with others, save money.
            </p>
          </motion.div>
        </section>

        {/* Route Pricing */}
        <section className="container mx-auto px-4 py-12">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center mb-8"
          >
            Route Prices
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {routes.map((route, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden ${route.popular ? "border-primary shadow-lg shadow-primary/20" : ""}`}
                >
                  {route.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground dark:text-white text-xs px-3 py-1 rounded-bl-lg">
                      Popular
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground dark:text-white mb-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{route.from}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{route.to}</span>
                    </div>
                    <CardTitle className="text-4xl font-bold">
                      ₦{route.price}
                      <span className="text-lg font-normal text-muted-foreground dark:text-white">/seat</span>
                    </CardTitle>
                    <CardDescription className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" />
                      {route.duration}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/auth/register">
                      <Button
                        className={`w-full ${route.popular ? "bg-gradient-to-r from-primary to-secondary" : ""}`}
                        variant={route.popular ? "default" : "outline"}
                      >
                        Book Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground dark:text-white mt-6"
          >
            * Prices may vary during peak hours. Return trips available at same rates.
          </motion.p>
        </section>

        {/* Benefits */}
        <section className="container mx-auto px-4 py-16">
          <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">What You Get</h2>
                <p className="text-muted-foreground dark:text-white mb-8">
                  EASELY offers the best value for UNILORIN students. Here's what's included with every ride.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="p-1 rounded-full bg-primary/10">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span>{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 text-center"
              >
                <div className="inline-flex items-center gap-2 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                  <span className="text-2xl font-bold">Share & Save</span>
                </div>
                <p className="text-muted-foreground dark:text-white mb-6">
                  When you share a ride with 8 other  students, you all pay just ₦600 each instead of ₦6300 for a private
                  ride!
                </p>
                <div className="p-2 text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  75% Savings
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Save on Your Commute?</h2>
            <p className="text-muted-foreground dark:text-white mb-8">
              Join EASELY today and start sharing rides with fellow students.
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary group">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
