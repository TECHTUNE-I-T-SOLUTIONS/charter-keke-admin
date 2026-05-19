import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { processOutboundQueue } from "@/lib/crm-email-service"

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
    const result = await processOutboundQueue(Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 20)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[CRM][EMAIL][OUTBOUND]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process outbound CRM email" },
      { status: 500 }
    )
  }
}