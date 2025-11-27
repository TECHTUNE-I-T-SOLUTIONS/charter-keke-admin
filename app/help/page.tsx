"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Particles } from "@/components/particles"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Car,
  CreditCard,
  Shield,
  Users,
  ArrowRight,
} from "lucide-react"

const helpCategories = [
  {
    icon: Car,
    title: "Booking Rides",
    description: "Learn how to book, modify, or cancel your rides",
    link: "/faq#booking",
  },
  {
    icon: CreditCard,
    title: "Payments & Wallet",
    description: "Managing payments, refunds, and your wallet balance",
    link: "/faq#payments",
  },
  {
    icon: Shield,
    title: "Safety & Security",
    description: "Safety features, emergency support, and reporting",
    link: "/safety",
  },
  {
    icon: Users,
    title: "Driver Information",
    description: "Becoming a driver, earnings, and requirements",
    link: "/faq#drivers",
  },
]

const contactMethods = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help via email",
    value: "easely@gmail.com",
    action: "mailto:easely@gmail.com",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Call us directly",
    value: "+234 808 319 1228",
    action: "tel:+2348083191228",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our team",
    value: "Available 8AM - 8PM",
    action: "/contact",
  },
]

export default function HelpPage() {
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
              How Can We{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Help You?
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Find guides, tutorials, and answers to get the most out of EASELY
            </p>
          </motion.div>
        </section>

        {/* Quick Links */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link href="/faq">
              <Button variant="outline" className="gap-2 bg-transparent">
                <BookOpen className="h-4 w-4" />
                FAQs
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="gap-2 bg-transparent">
                <MessageCircle className="h-4 w-4" />
                Contact Us
              </Button>
            </Link>
            <Link href="/safety">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Shield className="h-4 w-4" />
                Safety
              </Button>
            </Link>
          </div>
        </section>

        {/* Help Categories */}
        <section className="container mx-auto px-4 py-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-center mb-8"
          >
            Browse Help Topics
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {helpCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={category.link}>
                  <Card className="h-full hover:border-primary/30 transition-all cursor-pointer group">
                    <CardHeader>
                      <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2 group-hover:bg-primary/20 transition-colors">
                        <category.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {category.title}
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact Methods */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground">Multiple ways to reach our support team</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <motion.a
                key={index}
                href={method.action}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full text-center hover:border-primary/30 transition-all cursor-pointer">
                  <CardContent className="pt-8">
                    <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                      <method.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-1">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                    <p className="text-primary font-medium">{method.value}</p>
                  </CardContent>
                </Card>
              </motion.a>
            ))}
          </div>
        </section>

        {/* FAQ CTA */}
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center"
          >
            <FileText className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Check Our FAQs</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Most questions have already been answered. Browse our comprehensive FAQ section.
            </p>
            <Link href="/faq">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary group">
                View All FAQs
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
