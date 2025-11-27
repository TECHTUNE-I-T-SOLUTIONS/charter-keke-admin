import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function CookiesPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">What Are Cookies</h2>
              <p className="text-muted-foreground">
                Cookies are small text files stored on your device when you visit our website. They help us remember
                your preferences and improve your experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
              <p className="text-muted-foreground">EASELY uses cookies to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences (theme, language)</li>
                <li>Analyze how our service is used</li>
                <li>Improve our services based on usage patterns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">Essential Cookies</h3>
                  <p className="text-muted-foreground">
                    Required for the website to function properly. These cannot be disabled.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Analytics Cookies</h3>
                  <p className="text-muted-foreground">
                    Help us understand how visitors interact with our website through Vercel Analytics.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Preference Cookies</h3>
                  <p className="text-muted-foreground">
                    Remember your settings like theme preference (light/dark mode).
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
              <p className="text-muted-foreground">
                You can control cookies through your browser settings. Note that disabling certain cookies may affect
                the functionality of our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground">Questions? Reach us at easely@gmail.com or +234 808 319 1228.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
