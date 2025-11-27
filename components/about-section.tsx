"use client"

import { Target, Heart, Shield, Zap } from "lucide-react"

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description: "To make campus commuting affordable, safe, and sustainable for every student in Nigeria.",
  },
  {
    icon: Heart,
    title: "Community First",
    description: "We believe in building connections. Every ride is an opportunity to meet fellow students.",
  },
  {
    icon: Shield,
    title: "Safety Always",
    description: "Verified drivers, real-time tracking, and 24/7 support ensure your safety is our priority.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We use cutting-edge technology to make ride-sharing seamless and efficient.",
  },
]

export function AboutSection() {
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            About{" "}
            <span className="bg-gradient-to-r from-[#b8507b] to-[#4353a4] bg-clip-text text-transparent">EASELY</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            We started EASELY with a simple idea: students shouldn&apos;t struggle with expensive transportation. Based
            in Ilorin, Nigeria, we&apos;re on a mission to transform how students commute - making it easier, cheaper,
            and more connected.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value) => (
            <div
              key={value.title}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#b8507b] to-[#4353a4] flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                <value.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-[#b8507b]/10 to-[#4353a4]/10 border border-primary/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">We&apos;re Just Getting Started</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              As a new platform, we&apos;re growing every day. Join us on this journey to revolutionize student
              transportation in Nigeria. Your feedback shapes our future!
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
