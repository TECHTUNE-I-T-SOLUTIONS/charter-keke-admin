import { NextRequest, NextResponse } from "next/server"
import { isSuperAdminUser, requireAdminSession } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"

const OPERATIONS_DEPARTMENTS = new Set(["operations", "ops"])

function canManagePricing(access: Awaited<ReturnType<typeof requireAdminSession>>) {
  if (!access.authorized || !access.session?.user) return false
  if (isSuperAdminUser(access.session.user, access.admin)) return true
  return OPERATIONS_DEPARTMENTS.has(String(access.admin?.department || access.admin?.admin_level || "").toLowerCase())
}

async function loadPricing() {
  const { data: setting, error } = await supabaseAdmin
    .from("pricing_settings")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!setting) return { setting: null, bands: [], metrics: [], audit: [] }

  const [bands, metrics, audit] = await Promise.all([
    supabaseAdmin
      .from("distance_bands")
      .select("*")
      .eq("pricing_setting_id", setting.id)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("route_metrics")
      .select("*")
      .order("ride_count", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("ride_pricing_audit")
      .select("id, action, previous_values, next_values, created_at, users:admin_user_id(first_name,last_name,email)")
      .eq("pricing_setting_id", setting.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  if (bands.error) throw bands.error
  if (metrics.error) throw metrics.error
  if (audit.error) throw audit.error

  return {
    setting,
    bands: bands.data || [],
    metrics: metrics.data || [],
    audit: audit.data || [],
  }
}

export async function GET(request: NextRequest) {
  const access = await requireAdminSession(request)
  if (!canManagePricing(access)) {
    return NextResponse.json({ error: "Operations access is required" }, { status: 403 })
  }

  try {
    return NextResponse.json(await loadPricing())
  } catch (error) {
    console.error("[AdminPricing] load failed:", error)
    return NextResponse.json({ error: "Failed to load pricing settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const access = await requireAdminSession(request)
  if (!canManagePricing(access)) {
    return NextResponse.json({ error: "Operations access is required" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const current = await loadPricing()
    const setting = current.setting

    if (!setting?.id) {
      return NextResponse.json({ error: "No active pricing setting found. Run the RAIL pricing SQL first." }, { status: 409 })
    }

    const bands = Array.isArray(body?.distanceBands) ? body.distanceBands : []
    if (!bands.length) {
      return NextResponse.json({ error: "At least one distance band is required" }, { status: 400 })
    }

    const nextSetting = {
      base_fare: Number(body.baseFare),
      minimum_fare: Number(body.minimumFare),
      per_minute: Number(body.perMinute),
      platform_fee_rate: Number(body.platformFeeRate ?? setting.platform_fee_rate ?? 0.15),
      eta_low_traffic_min_per_km: Number(body.etaPerKm?.lowTraffic),
      eta_normal_traffic_min_per_km: Number(body.etaPerKm?.normalTraffic),
      eta_heavy_traffic_min_per_km: Number(body.etaPerKm?.heavyTraffic),
      learning_weight: Number(body.learningWeight ?? setting.learning_weight ?? 0.1),
      notes: typeof body.notes === "string" ? body.notes : setting.notes,
      updated_by: access.session?.user?.id,
    }

    const values = Object.values(nextSetting).filter((value) => typeof value === "number")
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      return NextResponse.json({ error: "Pricing values must be valid positive numbers" }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from("pricing_settings")
      .update(nextSetting)
      .eq("id", setting.id)

    if (updateError) throw updateError

    const { error: deleteError } = await supabaseAdmin
      .from("distance_bands")
      .delete()
      .eq("pricing_setting_id", setting.id)

    if (deleteError) throw deleteError

    const nextBands = bands.map((band: any, index: number) => ({
      pricing_setting_id: setting.id,
      max_km: band.maxKm === null || band.maxKm === "" || String(band.maxKm).toLowerCase() === "infinity" ? null : Number(band.maxKm),
      rate: Number(band.rate),
      sort_order: index + 1,
    }))

    if (nextBands.some((band: any) => !Number.isFinite(band.rate) || band.rate < 0 || (band.max_km !== null && (!Number.isFinite(band.max_km) || band.max_km <= 0)))) {
      return NextResponse.json({ error: "Distance bands must have valid rates and max distances" }, { status: 400 })
    }

    const { error: insertError } = await supabaseAdmin.from("distance_bands").insert(nextBands)
    if (insertError) throw insertError

    await supabaseAdmin.from("ride_pricing_audit").insert({
      pricing_setting_id: setting.id,
      admin_user_id: access.session?.user?.id,
      action: "updated",
      previous_values: { setting, bands: current.bands },
      next_values: { setting: nextSetting, bands: nextBands },
    })

    return NextResponse.json(await loadPricing())
  } catch (error) {
    console.error("[AdminPricing] update failed:", error)
    return NextResponse.json({ error: "Failed to update pricing settings" }, { status: 500 })
  }
}
