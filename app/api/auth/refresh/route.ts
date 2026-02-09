import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 [REFRESH] Received token refresh request")
    
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      console.error("❌ [REFRESH] No refresh token provided")
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 400 }
      )
    }

    console.log("🔑 [REFRESH] Refresh token received, length:", refreshToken.length)

    // Decode the refresh token to get user ID
    try {
      const decoded = Buffer.from(refreshToken, "base64").toString("utf-8")
      console.log("✅ [REFRESH] Decoded refresh token:", decoded)
      const [userId] = decoded.split(":") // Format: userId:timestamp

      if (!userId) {
        console.error("❌ [REFRESH] Invalid token format")
        return NextResponse.json(
          { error: "Invalid token format" },
          { status: 401 }
        )
      }

      // Verify user still exists
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (error || !user) {
        console.error("❌ [REFRESH] User not found:", error)
        return NextResponse.json(
          { error: "User not found" },
          { status: 401 }
        )
      }

      if (user.status !== "active") {
        console.error("❌ [REFRESH] User not active:", user.status)
        return NextResponse.json(
          { error: "User account is not active" },
          { status: 403 }
        )
      }

      // Create new token
      const newToken = Buffer.from(`${user.id}:${Date.now()}`).toString("base64")
      console.log("✅ [REFRESH] New token created")

      // Build role-specific user object
      let userData;
      if (user.role === 'driver') {
        userData = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone_number,
          role: 'driver' as const,
          avatar: user.profile_picture_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at || user.created_at,
          licenseNumber: user.license_number || '',
          licenseExpiry: user.license_expiry || '',
          vehicleType: user.vehicle_type || 'keke',
          vehicleMake: user.vehicle_make || '',
          vehicleModel: user.vehicle_model || '',
          vehicleColor: user.vehicle_color || '',
          vehicleRegistration: user.vehicle_registration || '',
          operatingZones: user.operating_zones || [],
          isVerified: user.is_verified || false,
          isActive: user.is_active || false,
          totalRides: user.total_rides || 0,
          averageRating: user.average_rating || 0,
          walletBalance: user.wallet_balance || 0,
          bankAccount: user.bank_name ? {
            bankName: user.bank_name,
            accountNumber: user.bank_account_number || '',
            accountHolder: user.bank_account_holder || '',
          } : undefined,
        };
      } else {
        userData = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone_number,
          role: 'rider' as const,
          avatar: user.profile_picture_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at || user.created_at,
          homeAddress: user.home_address || '',
          workAddress: user.work_address || '',
          emergencyContact: user.emergency_contact_name ? {
            name: user.emergency_contact_name,
            phone: user.emergency_contact_phone || '',
          } : undefined,
          rideCount: user.ride_count || 0,
          averageRating: user.average_rating || 0,
          walletBalance: user.wallet_balance || 0,
        };
      }

      return NextResponse.json(
        {
          token: newToken,
          refreshToken: newToken,
          user: userData,
          message: "Token refreshed successfully",
        },
        { status: 200 }
      )
    } catch (e) {
      console.error("❌ [REFRESH] Failed to decode token:", e)
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("❌ [REFRESH] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
