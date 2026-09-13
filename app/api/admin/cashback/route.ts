import { NextRequest, NextResponse } from "next/server"
import { isSuperAdminUser, requireAdminSession } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"

// GET - Fetch all cashback programs (for super admins)
export async function GET(request: NextRequest) {
  const access = await requireAdminSession(request)
  if (!isSuperAdminUser(access.session?.user, access.admin)) {
    return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const active = searchParams.get("active")

    let query = supabaseAdmin
      .from("cashback_programs")
      .select("*")
      .order("created_at", { ascending: false })

    if (type) {
      query = query.eq("program_type", type)
    }

    if (active !== null) {
      query = query.eq("is_active", active === "true")
    }

    const { data: programs, error } = await query

    if (error) throw error

    // Get stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .from("user_cashback_stats")
      .select("*")

    if (statsError) throw statsError

    return NextResponse.json({ 
      programs,
      stats: {
        totalUsers: stats?.length || 0,
        totalCashbackEarned: stats?.reduce((sum, stat) => sum + (stat.total_cashback_earned || 0), 0) || 0,
        totalCashbackUsed: stats?.reduce((sum, stat) => sum + (stat.total_cashback_used || 0), 0) || 0,
      }
    })
  } catch (error) {
    console.error("[CashbackAdmin] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch cashback programs" }, { status: 500 })
  }
}

// POST - Create new cashback program (for super admins)
export async function POST(request: NextRequest) {
  const access = await requireAdminSession(request)
  if (!isSuperAdminUser(access.session?.user, access.admin)) {
    return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      programType,
      discountPercentage,
      maxDiscountAmount,
      minOrderAmount,
      validAfterRides,
      validForRidesCount,
      expiryDays,
      startDate,
      endDate,
      terms,
      imageUrl,
      priority
    } = body

    const { data: program, error } = await supabaseAdmin
      .from("cashback_programs")
      .insert({
        name,
        description,
        program_type: programType,
        discount_percentage: discountPercentage,
        max_discount_amount: maxDiscountAmount,
        min_order_amount: minOrderAmount || 0,
        valid_after_rides: validAfterRides || 0,
        valid_for_rides_count: validForRidesCount || 1,
        expiry_days: expiryDays,
        start_date: startDate,
        end_date: endDate,
        terms,
        image_url: imageUrl,
        priority: priority || 0,
        is_active: true,
        created_by: access.session?.user?.id,
        updated_by: access.session?.user?.id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ program })
  } catch (error) {
    console.error("[CashbackAdmin] POST error:", error)
    return NextResponse.json({ error: "Failed to create cashback program" }, { status: 500 })
  }
}

// PUT - Update cashback program (for super admins)
export async function PUT(request: NextRequest) {
  const access = await requireAdminSession(request)
  if (!isSuperAdminUser(access.session?.user, access.admin)) {
    return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Program ID required" }, { status: 400 })
    }

    const { data: program, error } = await supabaseAdmin
      .from("cashback_programs")
      .update({
        ...updateData,
        updated_by: access.session?.user?.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ program })
  } catch (error) {
    console.error("[CashbackAdmin] PUT error:", error)
    return NextResponse.json({ error: "Failed to update cashback program" }, { status: 500 })
  }
}

// DELETE - Delete cashback program (for super admins)
export async function DELETE(request: NextRequest) {
  const access = await requireAdminSession(request)
  if (!isSuperAdminUser(access.session?.user, access.admin)) {
    return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Program ID required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("cashback_programs")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[CashbackAdmin] DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete cashback program" }, { status: 500 })
  }
}