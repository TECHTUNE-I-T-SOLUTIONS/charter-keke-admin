import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push-service";

/**
 * POST /api/push/test
 * Send a test push notification to the authenticated user
 * Used for testing and debugging
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title = "Test Notification", body: bodyText = "This is a test push notification" } = body;

    const results = await sendPushNotification([session.user.id], {
      title,
      body: bodyText,
      type: "ride_update",
      data: {
        timestamp: new Date().toISOString(),
        testMode: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test notification sent",
      results,
    });
  } catch (error: any) {
    console.error("Push test error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
