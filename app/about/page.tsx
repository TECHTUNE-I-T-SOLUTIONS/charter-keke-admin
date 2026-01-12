"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Particles } from "@/components/particles"
import { GraduationCap, Heart, Shield, Users, Target, Eye, Lightbulb } from "lucide-react"

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description: "Every driver and rider is verified. Your security is our top priority.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Built by Lagosians, for keke riders. We understand your needs.",
  },
  {
    icon: Heart,
    title: "Affordability",
    description: "Keke rider budgets matter. We keep prices fair and transparent.",
  },
]

export default function AboutPage() {
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
              <Image src="/charter keke.png" alt="Charter Keke" width={24} height={24} />
              <span className="text-sm font-medium">Keke Transport in Lagos</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Charter Keke</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              We're on a mission to make keke rides easier, safer, and more affordable for every Lagosian.
            </p>
          </motion.div>
        </section>

        {/* Story */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Charter Keke was born out of a simple observation: getting around Lagos shouldn't be a daily struggle. We saw people waiting endlessly for rides, paying high prices, or missing commitments because of transportation issues.
                </p>
                <p>
                  We created Charter Keke to connect riders with verified keke drivers, making rides more accessible, affordable,
                  and safe. By sharing rides, we're not just saving money – we're building a stronger community.
                </p>
                <p>
                  Today, Charter Keke serves routes across Debari, Shomolu, and Yaba, helping people get where they need to go, when they need to be there.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
                <video
                  src="/Inside a Green Rickshaw in Sri Lanka - Free Stock Video Footage.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover rounded-3xl"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 p-4 rounded-2xl bg-card border border-border shadow-lg">
                <p className="text-2xl font-bold text-primary">2025</p>
                <p className="text-sm text-muted-foreground">Launched</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="container mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-white flex flex-col items-center justify-center text-center"
            >
              <div className="p-3 rounded-xl bg-white/20 w-fit mb-4 flex items-center justify-center">
              <Target className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-white/90">
              To provide safe, affordable, and reliable transportation for every keke rider in Lagos, fostering a
              community of trust and shared responsibility.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-secondary to-secondary/80 text-white flex flex-col items-center justify-center text-center"
            >
              <div className="p-3 rounded-xl bg-white/20 w-fit mb-4 flex items-center justify-center">
              <Eye className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-white/90">
              To become the go-to transportation platform for Lagosians, expanding across the city with reliable keke services while maintaining our community-first approach.
              </p>
            </motion.div>
            </div>
        </section>

        {/* Values */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground">What drives everything we do</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="p-8 rounded-2xl bg-card border border-border text-center hover:border-primary/30 transition-all"
              >
                <div className="p-4 rounded-2xl bg-primary/10 w-fit mx-auto mb-6">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Location */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center"
          >
            <Lightbulb className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Based in Lagos, Nigeria</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Charter Keke is proudly based in Lagos. We're local, we understand the challenges, and we're
              committed to making keke transportation better for every rider.
            </p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
