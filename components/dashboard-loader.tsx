"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function DashboardLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Image src="/charter keke.png" alt="Charter Keke" width={112} height={112} className="rounded-2xl drop-shadow-2xl" />
        </motion.div>

        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="h-1.5 w-48 overflow-hidden rounded-full bg-primary/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
            />
          </motion.div>

          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Preparing your dashboard...
          </motion.p>
        </div>

        <motion.div
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {Array.from({ length: 20 }).map((_, i) => {
            // Use a deterministic set of positions for hydration safety
            const left = `${(i * 37) % 100}%`;
            const top = `${(i * 61) % 100}%`;
            const duration = 2 + ((i * 13) % 20) / 10;
            const delay = ((i * 7) % 20) / 10;
            return (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full bg-primary/20"
                style={{ left, top }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration, repeat: Number.POSITIVE_INFINITY, delay }}
              />
            );
          })}
        </motion.div>
      </div>
    </div>
  )
}
