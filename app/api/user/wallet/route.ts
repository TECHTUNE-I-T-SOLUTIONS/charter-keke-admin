import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get wallet
    const { data: walletData } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    // Get transaction history
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_id", walletData?.id)
      .order("created_at", { ascending: false })
      .limit(50)

    return NextResponse.json({
      wallet: walletData,
      transactions: transactions || [],
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch wallet data" },
      { status: 500 }
    )
  }
}
