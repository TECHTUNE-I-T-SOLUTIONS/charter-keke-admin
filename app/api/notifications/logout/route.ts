import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Send a quick logout confirmation push to the user's devices
    try {
      await sendPushNotification([userId], {
        title: "🔒 Logged Out",
        body: "You have been logged out of your account.",
        type: "ride_update",
        data: {
          action: "user_logout_notification",
        },
      });
    } catch (err) {
      console.error("Logout push error:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
