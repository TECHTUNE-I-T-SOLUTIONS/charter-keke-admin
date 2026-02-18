import { type NextRequest, NextResponse } from "next/server";
import {
  initializePushNotifications,
  storePushSubscription,
  getSubscriptionStatus,
  removeSubscription,
} from "@/lib/push-service";

// Initialize push notifications
initializePushNotifications();

/**
 * GET /api/push/subscribe
 * Get push subscription status
 */
export async function GET(request: NextRequest) {
  try {
    const status = getSubscriptionStatus();
    return NextResponse.json({
      status: "active",
      ...status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/push/subscribe
 * Subscribe a user to push notifications
 * Body: { userId, pushToken, platform }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pushToken, platform } = body;

    if (!userId || !pushToken || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: userId, pushToken, platform" },
        { status: 400 }
      );
    }

    const subscription = storePushSubscription({
      userId,
      pushToken,
      subscribedAt: new Date().toISOString(),
      platform: platform as "ios" | "android" | "web",
    });

    console.log("✅ [API] Push subscription created for user:", userId);

    return NextResponse.json(
      {
        success: true,
        message: "Subscription successful",
        subscription,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ [API] Subscription error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe a user from push notifications
 * Body: { userId }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    removeSubscription(userId);

    console.log("✅ [API] User unsubscribed:", userId);

    return NextResponse.json({
      success: true,
      message: "Unsubscription successful",
    });
  } catch (error: any) {
    console.error("❌ [API] Unsubscription error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
