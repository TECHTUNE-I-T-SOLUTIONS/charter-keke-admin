"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Download, Apple, Smartphone, QrCode } from "lucide-react"

interface AppDownloadCTAProps {
  title: string
  description: string
  showQRCode?: boolean
}

export function AppDownloadCTA({ title, description, showQRCode = true }: AppDownloadCTAProps) {
  const appStoreUrl = "https://apps.apple.com/app/ID6671919119"
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.easely.app"

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Main Message */}
      <motion.div variants={itemVariants} className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-4 w-fit"
        >
          <Smartphone className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{title}</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">{description}</p>
      </motion.div>

      {/* QR Code Section */}
      {showQRCode && (
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <Image
              src="/qr-code-app-download.png"
              alt="Download our mobile app"
              width={200}
              height={200}
              className="rounded-lg"
            />
            <p className="text-sm text-center text-muted-foreground mt-3">
              Scan to download
            </p>
          </div>
        </motion.div>
      )}

      {/* App Store Links */}
      <motion.div variants={itemVariants} className="space-y-3">
        <p className="text-center text-sm font-semibold text-foreground/70">OR DOWNLOAD FROM</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white gap-2"
            >
              <Apple className="w-5 h-5" />
              <span>App Store</span>
            </Button>
          </motion.a>

          <motion.a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <Smartphone className="w-5 h-5" />
              <span>Google Play</span>
            </Button>
          </motion.a>
        </div>
      </motion.div>

      {/* Features List */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-2xl border border-primary/10"
      >
        <h3 className="font-semibold text-foreground mb-4">Available on Mobile Only</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-foreground/80">Seamless login and registration</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-foreground/80">Real-time location tracking</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-foreground/80">Instant notifications</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-foreground/80">Enhanced mobile experience</span>
          </li>
        </ul>
      </motion.div>
    </motion.div>
  )
}
