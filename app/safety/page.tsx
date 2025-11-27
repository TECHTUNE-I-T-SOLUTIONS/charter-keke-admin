"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Particles } from "@/components/particles"
import { Shield, UserCheck, MapPin, Phone, Bell, Eye, Lock, Users, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const safetyFeatures = [
  {
    icon: UserCheck,
    title: "Verified Users",
    description: "All drivers and riders must verify their identity. Drivers undergo additional background checks.",
  },
  {
    icon: MapPin,
    title: "Real-time Tracking",
    description: "Track your ride in real-time and share your trip status with friends and family.",
  },
  {
    icon: Phone,
    title: "Emergency Support",
    description: "Access emergency assistance directly from the app with our 24/7 support line.",
  },
  {
    icon: Bell,
    title: "Trip Alerts",
    description: "Get notifications at every stage of your trip, from pickup to destination.",
  },
  {
    icon: Eye,
    title: "Ride Monitoring",
    description: "Our team monitors rides for unusual activity and can intervene if needed.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "All payments are encrypted and processed through secure payment gateways.",
  },
]

const safetyTips = [
  "Always verify the driver and vehicle details before getting in",
  "Share your ride details with a trusted friend or family member",
  "Sit in the back seat when riding alone",
  "Keep your phone charged and location services enabled",
  "Trust your instincts - if something feels wrong, don't take the ride",
  "Report any concerning behavior immediately through the app",
]

export default function SafetyPage() {
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
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Your Safety Matters</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Safety is Our{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Priority</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              We've built multiple layers of protection to ensure every EASELY ride is safe and secure.
            </p>
          </motion.div>
        </section>

        {/* Safety Features */}
        <section className="container mx-auto px-4 py-12">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center mb-12"
          >
            How We Keep You Safe
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {safetyFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full hover:border-primary/30 transition-all">
                  <CardContent className="pt-6">
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Community Safety */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 text-primary mb-4">
                <Users className="h-5 w-5" />
                <span className="font-medium">Community Safety</span>
              </div>
              <h2 className="text-3xl font-bold mb-6">A Community Built on Trust</h2>
              <p className="text-muted-foreground mb-6">
                EASELY is more than just a ride-sharing app - it's a community of UNILORIN students looking out for each
                other. Our rating and review system helps maintain high standards for both riders and drivers.
              </p>
              <ul className="space-y-3">
                {[
                  "Two-way ratings after every ride",
                  "Detailed reviews visible to all users",
                  "Community reporting system",
                  "Regular safety audits",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl p-8"
            >
              <AlertTriangle className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Safety Tips</h3>
              <ul className="space-y-4">
                {safetyTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="p-1 rounded-full bg-primary/20 text-primary shrink-0 mt-0.5">{index + 1}</span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Emergency CTA */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-destructive/10 border border-destructive/20 rounded-3xl p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-destructive/20">
                  <Phone className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Emergency Support</h3>
                  <p className="text-muted-foreground">Available 24/7 for urgent safety concerns</p>
                </div>
              </div>
              <a href="tel:+2348083191228">
                <Button size="lg" variant="destructive">
                  Call Emergency Line
                </Button>
              </a>
            </div>
          </motion.div>
        </section>

        {/* Help CTA */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-muted-foreground mb-4">Have questions about our safety measures?</p>
            <Link href="/help">
              <Button variant="outline" className="gap-2 bg-transparent">
                Visit Help Center
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
