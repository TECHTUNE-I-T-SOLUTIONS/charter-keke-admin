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
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#b8507b" />
      </head>
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
