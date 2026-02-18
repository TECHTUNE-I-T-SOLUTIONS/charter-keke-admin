import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { acceptRideFirstCome } from "@/lib/ride-acceptance";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rideId } = body;

    if (!rideId) {
      return NextResponse.json(
        { error: "Ride ID is required" },
        { status: 400 }
      );
    }

    const acceptance = await acceptRideFirstCome({
      rideId,
      driverUserId: session.user.id,
      source: "app",
    });

    if (!acceptance.success) {
      return NextResponse.json(
        {
          error: acceptance.message,
          code: acceptance.code,
        },
        { status: acceptance.status }
      );
    }

    return NextResponse.json({
      success: true,
      ride: acceptance.ride,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
