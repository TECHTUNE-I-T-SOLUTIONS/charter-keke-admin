"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Particles } from "@/components/particles"
import { UserPlus, MapPin, Car, CreditCard, Star, Shield, Smartphone, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up as a rider or driver. Complete your profile and get verified to start using Charter Keke.",
    color: "from-primary to-primary/80",
  },
  {
    icon: MapPin,
    title: "Choose Your Route",
    description:
      "Select your pickup and destination. We cover routes across Debari, Shomolu, and Yaba in Lagos.",
    color: "from-secondary to-secondary/80",
  },
  {
    icon: Car,
    title: "Find Your Ride",
    description: "Browse available keke rides or request one. Connect with verified drivers and fellow riders.",
    color: "from-primary to-secondary",
  },
  {
    icon: CreditCard,
    title: "Pay Securely",
    description: "Pay through the app with Paystack. Split costs with fellow riders and save money.",
    color: "from-secondary to-primary",
  },
  {
    icon: Star,
    title: "Rate & Review",
    description: "Share your experience to help the community. Build trust through verified reviews.",
    color: "from-primary to-primary/80",
  },
]

const features = [
  { icon: Shield, title: "Verified Riders", description: "All users are verified for safety" },
  { icon: Smartphone, title: "Real-time Tracking", description: "Track your ride in real-time" },
  { icon: Users, title: "Ride Sharing", description: "Share rides to split costs" },
  { icon: CreditCard, title: "Secure Payments", description: "Powered by Paystack" },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Particles />
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Charter Keke</span>{" "}
              Works
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Getting around Lagos has never been easier. Follow these simple steps to start your journey.
            </p>
          </motion.div>
        </section>

        {/* Steps Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-primary opacity-20" />

            <div className="space-y-12 lg:space-y-24">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`flex flex-col lg:flex-row items-center gap-8 ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                      Step {index + 1}
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                    <p className="text-muted-foreground max-w-md">{step.description}</p>
                  </div>

                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`p-8 rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-xl`}
                    >
                      <step.icon className="h-12 w-12" />
                    </motion.div>
                    <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-xl -z-10" />
                  </div>

                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why Choose Charter Keke?</h2>
            <p className="text-muted-foreground">The most reliable keke transport in Lagos</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
              >
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-8 md:p-12 text-center text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Join the Charter Keke community and start sharing affordable rides today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="group">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
