/**
 * Server-only Paystack utilities
 * This file is used only in API routes and server actions
 */

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
 * Server-side function to verify bank account using Paystack API
 * Uses the secret key for security - only call from server-side code
 */
export async function verifyBankAccountServer(
  accountNumber: string,
  bankCode: string
): Promise<BankVerificationResponse> {
  try {
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const data = await response.json()

    if (data.status) {
      return {
        status: true,
        message: "Account verified",
        data: {
          account_number: data.data.account_number,
          account_name: data.data.account_name,
          bank_id: parseInt(bankCode),
        },
      }
    }

    return {
      status: false,
      message: data.message || "Account not found",
    }
  } catch (error) {
    console.error("Server-side bank verification error:", error)
    return {
      status: false,
      message: "Verification service unavailable",
    }
  }
}
