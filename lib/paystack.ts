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

// ============ BANK VERIFICATION FUNCTIONS ============

export interface Bank {
  id: number
  name: string
  code: string
  longcode: string
  gateway: string | null
  pay_with_bank: boolean
  active: boolean
  country_id: number
  is_deleted: boolean
  createdAt: string
  updatedAt: string
}

export interface BankVerificationResponse {
  status: boolean
  message: string
  data?: {
    account_number: string
    account_name: string
    bank_id: number
  }
}

/**
 * Fetch list of all Nigerian banks from Paystack
 * Filtered for active banks only
 */
export async function fetchBanksFromPaystack(): Promise<Bank[]> {
  try {
    const response = await fetch("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY}`,
      },
    })

    if (!response.ok) {
      console.error("Failed to fetch banks from Paystack:", response.statusText)
      return []
    }

    const data = await response.json()

    if (data.status && data.data) {
      return data.data.filter((bank: Bank) => bank.active)
    }

    return []
  } catch (error) {
    console.error("Error fetching banks:", error)
    return []
  }
}

/**
 * Verify bank account details using Paystack
 * Calls the backend API route for security
 */
export async function verifyBankAccount(
  accountNumber: string,
  bankCode: string
) {
  try {
    const response = await fetch("/api/paystack/verify-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountNumber,
        bankCode,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        status: false,
        message: data.error || "Verification failed",
      }
    }

    return data
  } catch (error) {
    console.error("Error verifying bank account:", error)
    return {
      status: false,
      message: "Unable to verify account at this time",
    }
  }
}

