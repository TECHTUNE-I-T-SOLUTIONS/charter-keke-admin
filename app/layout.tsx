import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Charter Keke Admin",
  description:
    "Operations, CRM, driver moderation, ride monitoring, and mobile app intelligence for Charter Keke.",
  keywords: ["keke rides", "tricycle", "Lagos", "Nigeria", "affordable transport", "ride sharing"],
  authors: [{ name: "Charter Keke Team" }],
  icons: {
    icon: "/charter keke.png",
    apple: "/charter keke.png",
  },
  openGraph: {
    title: "Charter Keke Admin",
    description: "Operations and customer support dashboard for Charter Keke.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f28c00" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
