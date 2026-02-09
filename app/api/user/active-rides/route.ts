import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 [ACTIVE-RIDES] Received request")
    console.log("🔑 [ACTIVE-RIDES] Authorization header:", request.headers.get("authorization"))
    
    // Try NextAuth session first (for web app)
    let session = await getSessionFromRequest(request)
    let userId: string | null = null

    if (session?.user?.id) {
      console.log("✅ [ACTIVE-RIDES] Found NextAuth session, userId:", session.user.id)
      userId = session.user.id
    } else {
      console.log("⚠️  [ACTIVE-RIDES] No NextAuth session, trying Bearer token")
      // Fall back to custom Bearer token (for mobile app)
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7)
        console.log("🔑 [ACTIVE-RIDES] Bearer token found, length:", token.length)
        try {
          const decoded = Buffer.from(token, "base64").toString("utf-8")
          console.log("✅ [ACTIVE-RIDES] Decoded token:", decoded)
          const [id] = decoded.split(":") // Format: userId:timestamp
          console.log("👤 [ACTIVE-RIDES] Extracted userId:", id)
          if (id) {
            userId = id
          }
        } catch (e) {
          console.error("❌ [ACTIVE-RIDES] Failed to decode Bearer token:", e)
        }
      }
    }

    if (!userId) {
      console.error("❌ [ACTIVE-RIDES] No userId found, returning 401")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get rider's active rides (pending, dispatched, accepted, in_progress)
    const { data: rides, error } = await supabase
      .from("rides")
      .select(
        `
        id,
        driver_id,
        pickup_zone,
        pickup_description,
        destination_zone,
        destination_description,
        distance_km,
        fare_amount,
        platform_fee,
        driver_earnings,
        seats_available,
        seats_booked,
        status,
        pickup_time,
        duration_minutes,
        rating,
        created_at,
        drivers:driver_id (id, user_id, vehicle_picture_url, plate_number, users:user_id (first_name, last_name, phone_number, profile_picture_url))
      `
      )
      .eq("rider_id", userId)
      .in("status", ["pending", "dispatched", "accepted", "in_progress"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch active rides:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ rides: rides || [] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch active rides" },
      { status: 500 }
    )
  }
}
