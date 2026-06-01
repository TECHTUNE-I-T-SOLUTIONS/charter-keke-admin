import { NextRequest, NextResponse } from "next/server"
import { requireCrmAccess } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireCrmAccess(request)
    if (!access.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("crm_departments")
      .select("id, department_key, department_name, description, email_alias, route_priority, is_active, created_at, updated_at")
      .order("route_priority", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ departments: data || [] })
  } catch (error) {
    console.error("[CRM][DEPARTMENTS][GET]", error)
    return NextResponse.json({ error: "Failed to load CRM departments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireCrmAccess(request)
    if (!access.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const departmentKey = String(body?.departmentKey || "").trim().toLowerCase()
    const departmentName = String(body?.departmentName || "").trim()
    const description = String(body?.description || "").trim() || null
    const emailAlias = String(body?.emailAlias || "").trim().toLowerCase() || null
    const routePriority = Number(body?.routePriority || 100)

    if (!departmentKey || !departmentName) {
      return NextResponse.json({ error: "departmentKey and departmentName are required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("crm_departments")
      .insert({
        department_key: departmentKey,
        department_name: departmentName,
        description,
        email_alias: emailAlias,
        route_priority: Number.isFinite(routePriority) ? routePriority : 100,
        is_active: true,
      })
      .select("id, department_key, department_name, description, email_alias, route_priority, is_active, created_at, updated_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ department: data }, { status: 201 })
  } catch (error) {
    console.error("[CRM][DEPARTMENTS][POST]", error)
    return NextResponse.json({ error: "Failed to create CRM department" }, { status: 500 })
  }
}
