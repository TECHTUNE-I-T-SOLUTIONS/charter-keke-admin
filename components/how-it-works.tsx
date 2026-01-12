"use client"

import Image from "next/image"
import { MapPin, CreditCard, Users } from "lucide-react"

const steps = [
  {
    icon: MapPin,
    title: "Enter Your Route",
    description: "Tell us where you're going and when you need to be there. Our smart system finds the best matches.",
  },
  {
    icon: Users,
    title: "Get Matched",
    description: "We automatically group you with other riders heading the same way. Share the journey, share the cost.",
  },
  {
    icon: CreditCard,
    title: "Pay Your Share",
    description: "Secure payment via Paystack. Only pay your portion - as low as ₦600 per ride!",
  },
  {
    title: "Enjoy the Ride",
    description: "Track your driver in real-time, chat with co-riders, and arrive safely at your destination.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How{" "}
            <span className="bg-gradient-to-r from-[#052659] to-[#4353a4] bg-clip-text dark:bg-gradient-to-r dark:from-[#C1E8FF] dark:to-[#CCD0E7FF] text-transparent">Charter Keke</span>{" "}
            Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Getting a ride has never been easier. Follow these simple steps to start saving money on your daily commute.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#052659] to-[#4353a4] opacity-20" />
              )}

              <div className="relative z-10 p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#052659] to-[#4353a4] flex items-center justify-center mb-4 text-white text-lg font-bold overflow-hidden">
                  {step.icon ? <step.icon className="h-6 w-6" /> : <Image src="/charter keke.png" alt="Charter Keke" width={48} height={48} />}
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#052659] to-[#4353a4] flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
