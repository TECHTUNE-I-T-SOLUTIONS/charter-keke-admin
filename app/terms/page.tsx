import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Charter Keke, you accept and agree to be bound by these Terms of Use. If you do not
                agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
              <p className="text-muted-foreground">To use Charter Keke, you must:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Be at least 18 years of age</li>
                <li>Have a valid phone number for verification</li>
                <li>Provide accurate and complete registration information</li>
                <li>Agree to receive SMS/email notifications for ride updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials and for all
                activities under your account. You agree to immediately notify us of any unauthorized use of your
                account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Ride Services</h2>
              <p className="text-muted-foreground">
                Charter Keke facilitates connections between riders and drivers. We do not provide transportation services
                directly. Drivers are independent contractors, not employees of Charter Keke.
              </p>
              <h3 className="text-xl font-semibold mt-4 mb-2">4.1 Pricing</h3>
              <p className="text-muted-foreground">
                Fares are calculated based on keke type and number of passengers. Standard rates:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Standard Keke: ₦700 per seat (₦3,500 total for full capacity)</li>
                <li>Premium Keke: ₦600 per seat (₦5,400 total for full capacity)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
              <p className="text-muted-foreground">
                All payments are processed through our secure payment gateway. By using our service, you authorize us to charge your
                selected payment method for the fare amount. Refunds may be issued at our discretion for cancelled
                rides.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Code of Conduct</h2>
              <p className="text-muted-foreground">Users must:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Treat other users with respect and courtesy</li>
                <li>Not engage in discriminatory, harassing, or threatening behavior</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not use the service for illegal purposes</li>
                <li>Report any safety concerns immediately</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Driver Requirements</h2>
              <p className="text-muted-foreground">Drivers must:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
                <li>Hold a valid driver&apos;s license</li>
                <li>Maintain valid keke insurance</li>
                <li>Pass our verification process</li>
                <li>Maintain a minimum rating of 4.0 stars</li>
                <li>Keep their keke in safe operating condition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Charter Keke is not liable for any direct, indirect, incidental, special, or consequential damages resulting
                from the use of our services. We are not responsible for the actions of drivers or other users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Continued use of the service after changes
                constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
              <p className="text-muted-foreground">For questions about these Terms of Use, contact us at:</p>
              <ul className="list-none text-muted-foreground space-y-2 mt-4">
                <li>Email: support@charterkeke.com</li>
                <li>Phone: +234 808 319 1228</li>
                <li>Location: Lagos, Nigeria</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
