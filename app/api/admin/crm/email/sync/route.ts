import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { processOutboundQueue, syncInboxNow } from "@/lib/crm-email-service"

function isAuthorizedBySecret(request: NextRequest) {
  const expectedSecret = process.env.CRM_EMAIL_WEBHOOK_SECRET
  if (!expectedSecret) return false
  const headerSecret = request.headers.get("x-crm-email-secret")
  return !!headerSecret && headerSecret === expectedSecret
}

async function isAuthorizedAdmin(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  return session?.user?.role === "admin" || session?.user?.role === "super_admin"
}

export async function POST(request: NextRequest) {
  try {
    const authorized = isAuthorizedBySecret(request) || (await isAuthorizedAdmin(request))
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const limit = Number(body?.limit || 20)
    const runOutbound = body?.runOutbound !== false

    const inbound = await syncInboxNow(Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 20)
    const outbound = runOutbound ? await processOutboundQueue(30) : null

    return NextResponse.json({
      success: true,
      inbound,
      outbound,
    })
  } catch (error) {
    console.error("[CRM][EMAIL][SYNC]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync CRM email inbox" },
      { status: 500 }
    )
  }
}