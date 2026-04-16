import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 [LOGOUT] Starting logout endpoint...");

    // Validate session
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      console.warn("⚠️ [LOGOUT] No valid session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`✅ [LOGOUT] User ${userId} initiated logout`);

    // Note: Token invalidation typically happens on the client side by:
    // 1. Clearing the token from secure storage
    // 2. Clearing the auth context
    // 
    // Server-side token invalidation would require a token blacklist/revocation table
    // which is not implemented yet. For now, we just validate the session exists
    // and the client handles clearing the token locally.

    console.log(`✅ [LOGOUT] Logout successful for user: ${userId}`);
    
    return NextResponse.json(
      { 
        success: true,
        message: "Logout successful" 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [LOGOUT] Error during logout:", error);
    return NextResponse.json(
      { error: "Internal server error during logout" },
      { status: 500 }
    );
  }
}
