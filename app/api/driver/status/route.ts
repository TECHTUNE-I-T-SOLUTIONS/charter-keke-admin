import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSessionFromRequest } from "@/lib/auth"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: driver, error } = await supabase
      .from("drivers")
      .select("id, availability_status, updated_at")
      .eq("user_id", session.user.id)
      .single()

    if (error || !driver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: driver.availability_status || "offline",
      updatedAt: driver.updated_at,
      driverId: driver.id,
    })
  } catch (error) {
    console.error("Failed to fetch driver status:", error)
    return NextResponse.json(
      { error: "Failed to fetch driver status" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (!["online", "offline", "busy"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const { data: driver, error } = await supabase
      .from("drivers")
      .update({
        availability_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id)
      .select("availability_status, updated_at")
      .single()

    if (error || !driver) {
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: driver.availability_status,
      updatedAt: driver.updated_at,
    })
  } catch (error) {
    console.error("Failed to update driver status:", error)
    return NextResponse.json(
      { error: "Failed to update driver status" },
      { status: 500 }
    )
  }
}
