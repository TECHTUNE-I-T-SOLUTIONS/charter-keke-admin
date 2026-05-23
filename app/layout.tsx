import type React from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "Charter Keke - Affordable Keke Rides in Lagos",
  description:
    "Fast and affordable keke rides across Debari, Shomolu, and Yaba in Lagos, Nigeria. Book your ride in seconds.",
  keywords: ["keke rides", "tricycle", "Lagos", "Nigeria", "affordable transport", "ride sharing"],
  authors: [{ name: "Charter Keke Team" }],
  icons: {
    icon: "/charter keke.png",
    apple: "/charter keke.png",
  },
  openGraph: {
    title: "Charter Keke - Affordable Keke Rides in Lagos",
    description: "Fast and affordable keke rides across Debari, Shomolu, and Yaba. Book your ride in seconds.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#b8507b" },
    { media: "(prefers-color-scheme: dark)", color: "#4353a4" },
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
      <body className={`${playfair.className} font-serif antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
