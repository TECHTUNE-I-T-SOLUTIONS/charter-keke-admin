"use client"

interface PaystackOptions {
  email: string
  amount: number // in kobo (NGN * 100)
  reference?: string
  currency?: string
  channels?: string[]
  metadata?: Record<string, unknown>
  onSuccess: (reference: string) => void
  onClose: () => void
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: Record<string, unknown>) => {
        openIframe: () => void
      }
    }
  }
}

export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Paystack"))
    document.body.appendChild(script)
  })
}

export async function initializePaystackPayment(options: PaystackOptions): Promise<void> {
  await loadPaystackScript()

  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxx"

  const reference = options.reference || `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email: options.email,
    amount: options.amount,
    currency: options.currency || "NGN",
    ref: reference,
    channels: options.channels || ["card", "bank", "ussd", "mobile_money"],
    metadata: {
      custom_fields: [],
      ...options.metadata,
    },
    callback: (response: { reference: string }) => {
      options.onSuccess(response.reference)
    },
    onClose: () => {
      options.onClose()
    },
  })

  handler.openIframe()
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount)
}
