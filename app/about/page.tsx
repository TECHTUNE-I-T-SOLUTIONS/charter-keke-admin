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
    description: "Built by students, for students. We understand your needs.",
  },
  {
    icon: Heart,
    title: "Affordability",
    description: "Student budgets matter. We keep prices fair and transparent.",
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
              <GraduationCap className="h-4 w-4" />
              <span className="text-sm font-medium">For UNILORIN Students</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">EASELY</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              We're on a mission to make campus transportation easier, safer, and more affordable for every UNILORIN
              student.
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
                  EASELY was born out of a simple observation: getting to and from the University of Ilorin shouldn't be
                  a daily struggle. We saw students waiting endlessly for buses, paying high prices for taxis, or
                  missing classes because of transportation issues.
                </p>
                <p>
                  We created EASELY to connect students with student drivers, making rides more accessible, affordable,
                  and safe. By sharing rides, we're not just saving money – we're building a stronger campus community.
                </p>
                <p>
                  Today, EASELY serves the routes between Oke-Odo, Tanke, downtown Ilorin, and the School Park, helping
                  students get where they need to go, when they need to be there.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Image src="/images/easely-06.png" alt="EASELY" width={800} height={800} className="drop-shadow-2xl" />
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
              To provide safe, affordable, and reliable transportation for every UNILORIN student, fostering a
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
              To become the go-to transportation platform for Nigerian university students, expanding to campuses
              across the country while maintaining our community-first approach.
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
            <h2 className="text-3xl font-bold mb-4">Based in Ilorin, Nigeria</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              EASELY is proudly based in Ilorin. We're local, we understand the challenges, and we're
              committed to making campus life better for every student.
            </p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
