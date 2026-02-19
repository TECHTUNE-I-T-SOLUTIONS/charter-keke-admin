import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const status = searchParams.get("status") // Filter by status: pending, completed, failed

    const { data: wallet } = await supabaseAdmin!
      .from("wallets")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!wallet?.id) {
      return NextResponse.json({ success: true, payments: [], statistics: {
        total_payments: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        total_amount_paid: 0,
        total_amount_pending: 0,
      }, total: 0, limit, offset })
    }

    // Load remittance transactions from transactions table (source=payout)
    const { data: allRemittanceTx, error: txError } = await supabaseAdmin!
      .from("transactions")
      .select("id, amount, reference, status, source, description, created_at, updated_at")
      .eq("wallet_id", wallet.id)
      .eq("source", "payout")
      .order("created_at", { ascending: false })

    if (txError) {
      throw txError
    }

    const txList = allRemittanceTx || []
    const normalized = txList.map((tx) => {
      const normalizedStatus =
        tx.status === "completed"
          ? "completed"
          : tx.status === "failed"
            ? "failed"
            : "pending"

      return {
        id: tx.id,
        amount: Number(tx.amount || 0),
        payment_method: "paystack",
        payment_reference: tx.reference || tx.id,
        status: normalizedStatus,
        payment_date: tx.created_at,
        confirmed_at: normalizedStatus === "completed" ? tx.updated_at : null,
        created_at: tx.created_at,
        description: tx.description || "Settlement payment",
      }
    })

    const filtered = status ? normalized.filter((tx) => tx.status === status) : normalized
    const payments = filtered.slice(offset, offset + limit)

    const statistics = {
      total_payments: normalized.length,
      completed: normalized.filter((p) => p.status === "completed").length,
      pending: normalized.filter((p) => p.status === "pending").length,
      failed: normalized.filter((p) => p.status === "failed").length,
      total_amount_paid: normalized
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
      total_amount_pending: normalized
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    }

    return NextResponse.json({
      success: true,
      payments: payments || [],
      statistics,
      total: filtered.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[PaymentHistory] error:", error)
    return NextResponse.json({ error: "Failed to fetch payment history" }, { status: 500 })
  }
}
