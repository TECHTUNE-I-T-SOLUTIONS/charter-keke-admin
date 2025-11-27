"use client"

import { Check, Users, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const pricingOptions = [
  {
    title: "4-Seater Car",
    price: "₦700",
    unit: "per seat",
    total: "₦3,500 total",
    features: [
      "Up to 5 passengers",
      "Comfortable sedan ride",
      "Real-time tracking",
      "In-app messaging",
      "Secure payments",
    ],
    icon: Car,
    popular: true,
  },
  {
    title: "8-Seater Bus",
    price: "₦600",
    unit: "per seat",
    total: "₦5,400 total",
    features: ["Up to 9 passengers", "Spacious seating", "Real-time tracking", "In-app messaging", "Secure payments"],
    icon: Users,
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple,{" "}
            <span className="bg-gradient-to-r from-[#b8507b] to-[#4353a4] bg-clip-text text-transparent">
              Transparent
            </span>{" "}
            Pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. Pay only for your seat. The more you share, the more you save.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingOptions.map((option) => (
            <div
              key={option.title}
              className={`relative p-8 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
                option.popular
                  ? "border-primary bg-gradient-to-br from-primary/5 to-secondary/5"
                  : "border-border bg-card"
              }`}
            >
              {option.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#b8507b] to-[#4353a4] text-white text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#b8507b] to-[#4353a4] flex items-center justify-center text-white">
                  <option.icon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{option.title}</h3>
                  <p className="text-muted-foreground text-sm">{option.total}</p>
                </div>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-bold">{option.price}</span>
                <span className="text-muted-foreground ml-2">{option.unit}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {option.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register">
                <Button
                  className={`w-full ${
                    option.popular ? "bg-gradient-to-r from-[#b8507b] to-[#4353a4] text-white hover:opacity-90" : ""
                  }`}
                  variant={option.popular ? "default" : "outline"}
                  size="lg"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Have a referral code?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Get 5% off your first ride!
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
