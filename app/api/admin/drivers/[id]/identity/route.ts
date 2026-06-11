import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, isSuperAdminUser } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"

function canManageDriverVerification(access: any) {
  const department = String(access.admin?.department || "").toLowerCase()
  return (
    access.authorized &&
    (isSuperAdminUser(access.session?.user, access.admin) ||
      ["hr", "human_resources", "operations", "driver_management"].includes(department))
  )
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAdminSession(request)
    if (!canManageDriverVerification(access)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || "").toLowerCase()
    const reason = String(body?.reason || "").trim()

    if (!["verify", "fail", "reset"].includes(action)) {
      return NextResponse.json({ error: "Invalid identity action" }, { status: 400 })
    }

    const update =
      action === "verify"
        ? {
            identity_verified: true,
            identity_verification_status: "verified",
            identity_verification_provider: "manual_admin",
            identity_verification_reason: null,
            identity_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : action === "fail"
          ? {
              identity_verified: false,
              identity_verification_status: "failed",
              identity_verification_provider: "manual_admin",
              identity_verification_reason: reason || "NIN document could not be verified.",
              identity_verified_at: null,
              updated_at: new Date().toISOString(),
            }
          : {
              identity_verified: false,
              identity_verification_status: "pending",
              identity_verification_provider: "manual_admin",
              identity_verification_reason: null,
              identity_verified_at: null,
              updated_at: new Date().toISOString(),
            }

    const { data: driver, error } = await supabaseAdmin
      .from("drivers")
      .update(update)
      .or(`id.eq.${id},user_id.eq.${id}`)
      .select("id, user_id, identity_verified, identity_verification_status, identity_verification_reason, identity_verified_at")
      .single()

    if (error || !driver) {
      return NextResponse.json({ error: error?.message || "Driver not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, driver })
  } catch (error) {
    console.error("[ADMIN][DRIVERS][IDENTITY]", error)
    return NextResponse.json({ error: "Failed to update identity verification" }, { status: 500 })
  }
}
