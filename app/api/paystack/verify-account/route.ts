import { verifyBankAccountServer } from "@/lib/paystack-server"

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Request body parse error:", parseError)
      return new Response(
        JSON.stringify({
          status: false,
          error: "Invalid JSON request body",
          details: "Failed to parse request body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const { accountNumber, bankCode } = body

    if (!accountNumber) {
      console.warn("Missing account number in verify request")
      return new Response(
        JSON.stringify({
          status: false,
          error: "Account number is required",
          field: "accountNumber",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!bankCode) {
      console.warn("Missing bank code in verify request")
      return new Response(
        JSON.stringify({
          status: false,
          error: "Bank code is required",
          field: "bankCode",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Validate account number format (10 digits)
    if (!/^\d{10}$/.test(accountNumber)) {
      console.warn(`Invalid account number format: ${accountNumber}`)
      return new Response(
        JSON.stringify({
          status: false,
          error: "Account number must be exactly 10 digits",
          received: `${accountNumber} (${accountNumber.length} digits)`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log(`Verifying account: ${accountNumber} with bank code: ${bankCode}`)

    const result = await verifyBankAccountServer(accountNumber, bankCode)

    if (!result.status) {
      console.warn(`Paystack verification failed: ${result.message}`)
    }

    return new Response(JSON.stringify(result), {
      status: result.status ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Bank verification error:", errorMessage, error)
    return new Response(
      JSON.stringify({
        status: false,
        error: "Internal server error",
        details: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
