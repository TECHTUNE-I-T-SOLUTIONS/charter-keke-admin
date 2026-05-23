"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Download, Smartphone } from "lucide-react"

type AuthDownloadCardProps = {
  title?: string
  description?: string
}

export function AuthDownloadCard({
  title = "Prefer the mobile app?",
  description = "Download the app to continue with live tracking, instant alerts, and the full ride experience.",
}: AuthDownloadCardProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || "https://charterkeke.vercel.app"
  const installUrl = `${baseUrl}/install`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(installUrl)}`

  return (
    <aside className="rounded-3xl border border-orange-200/70 bg-gradient-to-br from-[#FF9203]/10 via-[#fff7ed] to-[#C57711]/10 p-6 shadow-lg dark:border-orange-900/40 dark:from-[#2C1F0F] dark:via-[#1f1408] dark:to-[#3c2409]">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#8D5308] shadow-sm dark:bg-white/10 dark:text-[#FFE7C7]">
        <Smartphone className="h-4 w-4" />
        Download app
      </div>

      <h2 className="mt-4 text-2xl font-bold text-[#7A4603] dark:text-[#FFE7C7]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-orange-800/80 dark:text-orange-100/80">{description}</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-orange-200 bg-white p-4 shadow-sm dark:border-orange-900/40 dark:bg-black/20">
        <img
          src={qrUrl}
          alt="Scan to download the app"
          width={220}
          height={220}
          className="mx-auto rounded-xl"
        />
        <p className="mt-3 text-center text-xs font-medium text-orange-700 dark:text-orange-200">
          Scan the QR code or tap the button below
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <Button asChild size="lg" className="w-full bg-[#FF9203] text-white hover:bg-[#E68900] dark:bg-[#C27107] dark:hover:bg-[#8D5308]">
          <Link href="/install">
            <Download className="mr-2 h-4 w-4" />
            Open app download page
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <p className="text-center text-xs text-orange-700 dark:text-orange-100">
          You can still continue on the web using the form on this page.
        </p>
      </div>
    </aside>
  )
}