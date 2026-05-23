import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  storePushSubscription,
  removeSubscription,
} from "@/lib/push-service";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // Get user from session/auth (supports both NextAuth and custom Bearer tokens)
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - please log in first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    // Accept both pushToken and push_token (snake_case from mobile)
    const pushToken = body.pushToken || body.push_token;
    const platform = body.platform;
    const status = body.status || 'unknown';

    if (!pushToken) {
      return NextResponse.json(
        { error: "pushToken is required" },
        { status: 400 }
      );
    }

    if (!platform) {
      return NextResponse.json(
        { error: "platform is required" },
        { status: 400 }
      );
    }

    // Validate platform if provided
    if (platform && !['ios', 'android', 'web'].includes(platform)) {
      return NextResponse.json(
        { error: "platform must be 'ios', 'android', or 'web'" },
        { status: 400 }
      );
    }

    // Log subscription details for debugging
    console.log(`📡 [NOTIFICATIONS] Storing subscription for user ${session.user.id}:`, {
      platform,
      hasToken: !!pushToken,
      status,
    });

    // Store the subscription
    const subscription = await storePushSubscription({
      userId: session.user.id,
      pushToken,
      platform,
      subscribedAt: new Date().toISOString(),
      status,
    });

    return NextResponse.json({ 
      success: true, 
      subscription,
      message: "Successfully subscribed to push notifications"
    });
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
    // Get user from session/auth
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - please log in first" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const push_token = body?.push_token;

    // If push_token provided, remove only that token
    // Otherwise remove all subscriptions for user
    if (push_token) {
      await removeSubscription(session.user.id, push_token);
    } else {
      await removeSubscription(session.user.id);
    }

    return NextResponse.json({ 
      success: true,
      message: "Successfully unsubscribed from push notifications"
    });
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
    // Get user from session/auth
    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - please log in first" },
        { status: 401 }
      );
    }

    // Query user's active subscriptions from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, push_token, platform, is_active, subscribed_at")
      .eq("user_id", session.user.id)
      .eq("is_active", true);

    if (error) {
      console.warn("Database query error:", error);
      // Return empty array if query fails (user has no subscriptions)
      return NextResponse.json({
        success: true,
        subscriptions: [],
        isSubscribed: false,
        count: 0,
      });
    }

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || [],
      isSubscribed: (subscriptions?.length || 0) > 0,
      count: subscriptions?.length || 0,
    });
  } catch (error) {
    console.error("Push status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
