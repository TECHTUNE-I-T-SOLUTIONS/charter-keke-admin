import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  storePushSubscription,
  removeSubscription,
  getSubscriptionStatus,
} from "@/lib/push-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pushToken, platform } = body || {};

    if (!pushToken || !platform) {
      return NextResponse.json(
        { error: "pushToken and platform are required" },
        { status: 400 }
      );
    }

    const role = session.user.role === "driver"
      ? "driver"
      : session.user.role === "admin" || session.user.role === "super_admin"
      ? "admin"
      : "rider";

    const subscription = storePushSubscription({
      userId: session.user.id,
      pushToken,
      platform,
      role,
      subscribedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    removeSubscription(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = getSubscriptionStatus();
    return NextResponse.json({
      success: true,
      mine: session.user.id,
      status,
    });
  } catch (error) {
    console.error("Push status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
