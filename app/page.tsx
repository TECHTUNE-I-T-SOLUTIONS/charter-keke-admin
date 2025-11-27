import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { PricingSection } from "@/components/pricing-section"
import { AboutSection } from "@/components/about-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { Particles } from "@/components/particles"

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      <Particles />
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <PricingSection />
      <AboutSection />
      <CTASection />
      <Footer />
    </main>
  )
}
