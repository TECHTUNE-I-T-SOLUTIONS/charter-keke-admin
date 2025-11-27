import type React from "react"
import type { Metadata, Viewport } from "next"
import { Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { LogoutDialog } from "@/components/logout-dialog"
import { Toaster } from "@/components/ui/sonner"
import { NotificationPrompt } from "@/components/notification-prompt"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "EASELY - Ride Sharing for Students",
  description:
    "The easiest way for students to share rides. Safe, affordable, and community-driven ride-sharing in Ilorin, Nigeria.",
  keywords: ["ride sharing", "students", "Ilorin", "Nigeria", "campus rides", "affordable transport"],
  authors: [{ name: "EASELY Team" }],
  openGraph: {
    title: "EASELY - Ride Sharing for Students",
    description: "The easiest way for students to share rides. Safe, affordable, and community-driven.",
    type: "website",
  },
    generator: 'v0.app'
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
      <body className={`${playfair.className} font-serif antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <AuthProvider>
            {children}
            <LogoutDialog />
            <NotificationPrompt />
          </AuthProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
