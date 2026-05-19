import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

async function assertAdmin(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin"
  return { session, isAdmin }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const { isAdmin } = await assertAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("crm_email_accounts")
      .select(
        `
          id,
          display_name,
          email_address,
          provider,
          department_id,
          is_active,
          last_synced_at,
          settings,
          created_at,
          updated_at,
          departments:department_id (
            id,
            department_key,
            department_name,
            email_alias
          )
        `
      )
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ emailAccounts: data || [] })
  } catch (error) {
    console.error("[CRM][EMAIL][ACCOUNTS][GET]", error)
    return NextResponse.json({ error: "Failed to load CRM email accounts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const { isAdmin } = await assertAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const displayName = String(body?.displayName || "").trim()
    const emailAddress = String(body?.emailAddress || "").trim().toLowerCase()
    const provider = String(body?.provider || "custom_imap").trim() || "custom_imap"
    const departmentId = body?.departmentId || null
    const settings = body?.settings && typeof body.settings === "object" ? body.settings : {}

    if (!displayName || !emailAddress) {
      return NextResponse.json({ error: "displayName and emailAddress are required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("crm_email_accounts")
      .insert({
        display_name: displayName,
        email_address: emailAddress,
        provider,
        department_id: departmentId,
        is_active: true,
        settings,
      })
      .select(
        `
          id,
          display_name,
          email_address,
          provider,
          department_id,
          is_active,
          last_synced_at,
          settings,
          created_at,
          updated_at
        `
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ emailAccount: data }, { status: 201 })
  } catch (error) {
    console.error("[CRM][EMAIL][ACCOUNTS][POST]", error)
    return NextResponse.json({ error: "Failed to create CRM email account" }, { status: 500 })
  }
}