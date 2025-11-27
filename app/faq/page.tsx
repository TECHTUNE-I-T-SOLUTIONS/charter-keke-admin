"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Particles } from "@/components/particles"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "What is EASELY?",
        a: "EASELY is a ride-sharing platform designed specifically for University of Ilorin students. We connect student riders with student drivers for safe, affordable transportation between campus and Oke-Odo.",
      },
      {
        q: "Who can use EASELY?",
        a: "EASELY is open to all University of Ilorin students, staff, and verified drivers. You need to create an account and verify your status to use the platform.",
      },
      {
        q: "What routes does EASELY cover?",
        a: "We currently cover routes between the School Park (UNILORIN campus) and Oke-Odo. We're constantly expanding based on demand.",
      },
    ],
  },
  {
    category: "Booking & Payments",
    questions: [
      {
        q: "How do I book a ride?",
        a: "After logging in, go to 'Book a Ride', select your pickup location and destination, choose the number of seats, and confirm your booking. You'll be matched with available drivers.",
      },
      {
        q: "How much does a ride cost?",
        a: "Prices start at ₦600 per seat for most routes. The exact price depends on your route and is shown before you confirm your booking. There are no hidden fees.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept payments through Paystack, which supports debit cards, bank transfers, and USSD. You can also add funds to your EASELY wallet for faster checkouts.",
      },
      {
        q: "Can I cancel a booking?",
        a: "Yes, you can cancel a booking up to 10 minutes before the scheduled pickup time for a full refund. Late cancellations may incur a small fee.",
      },
    ],
  },
  {
    category: "For Drivers",
    questions: [
      {
        q: "How do I become an EASELY driver?",
        a: "Sign up as a driver through our registration page. You'll need to provide your driver's license, vehicle documents, and pass our verification process.",
      },
      {
        q: "How do drivers get paid?",
        a: "Drivers receive payments directly to their bank account. You can request a payout anytime, and funds are typically transferred within 24 hours.",
      },
      {
        q: "What percentage does EASELY take?",
        a: "EASELY takes a small service fee of 15% per ride to maintain the platform and provide support. Drivers keep 85% of each fare.",
      },
    ],
  },
  {
    category: "Safety & Support",
    questions: [
      {
        q: "Is EASELY safe?",
        a: "Safety is our top priority. All drivers are verified, rides are tracked in real-time, and we have an emergency support system. You can also share your ride status with friends and family.",
      },
      {
        q: "What if I have an issue during a ride?",
        a: "You can use the in-app emergency button to contact our support team immediately. You can also report any issues after the ride through the app.",
      },
      {
        q: "How do I contact support?",
        a: "You can reach us through the Help Center in the app, email us at easely@gmail.com, or call +234 808 319 1228 during business hours.",
      },
    ],
  },
  {
    category: "Referrals & Rewards",
    questions: [
      {
        q: "How does the referral program work?",
        a: "Share your unique referral code with friends. When they sign up and complete their first ride, you get 5% off your next booking!",
      },
      {
        q: "Where do I find my referral code?",
        a: "Your referral code is available in your dashboard under the 'Referrals' section. You can copy and share it easily from there.",
      },
    ],
  },
]

export default function FAQPage() {
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
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Help Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Questions
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">Find answers to common questions about EASELY</p>
          </motion.div>
        </section>

        {/* FAQ Sections */}
        <section className="container mx-auto px-4 py-8 max-w-4xl">
          {faqs.map((section, sectionIndex) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold mb-4 text-primary">{section.category}</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {section.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`${sectionIndex}-${index}`}
                    className="border border-border rounded-lg px-4 data-[state=open]:border-primary/30 transition-colors"
                  >
                    <AccordionTrigger className="text-left hover:no-underline hover:text-primary">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </section>

        {/* Contact CTA */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-8 md:p-12 text-center text-white"
          >
            <MessageCircle className="h-12 w-12 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Link href="/contact">
              <Button size="lg" variant="secondary">
                Contact Support
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
