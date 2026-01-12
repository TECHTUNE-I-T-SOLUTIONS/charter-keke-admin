import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountNumber, bankCode, accountName, action, driverId } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    // Get current user from auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Action 1: Verify account with Paystack API
    if (action === "verify") {
      if (!accountNumber || !bankCode) {
        return NextResponse.json(
          { error: "Account number and bank code are required" },
          { status: 400 }
        );
      }

      try {
        // Call Paystack API to verify account
        const paystackResponse = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );

        if (!paystackResponse.ok) {
          // Check if it's a rate limit error
          if (paystackResponse.status === 429) {
            return NextResponse.json(
              {
                error: "API rate limit reached. Please enter account name manually.",
                requiresManualEntry: true,
              },
              { status: 429 }
            );
          }

          const errorData = await paystackResponse.json();
          return NextResponse.json(
            { error: errorData.message || "Verification failed" },
            { status: 400 }
          );
        }

        const data = await paystackResponse.json();

        if (!data.status) {
          return NextResponse.json(
            { error: data.message || "Account not found" },
            { status: 400 }
          );
        }

        // Update driver record with account name from Paystack
        const accountNameFromPaystack = data.data.account_name;
        const { error: updateError } = await supabase
          .from("drivers")
          .update({
            account_name: accountNameFromPaystack,
            updated_at: new Date(),
          })
          .eq("id", driverId);

        if (updateError) {
          return NextResponse.json(
            { error: "Failed to save account details" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          accountName: accountNameFromPaystack,
          message: "Account verified successfully",
        });
      } catch (error: any) {
        console.error("Paystack verification error:", error);

        // If it's a network error or timeout, suggest manual entry
        if (error.message === "Failed to fetch" || error.code === "ECONNREFUSED") {
          return NextResponse.json(
            {
              error: "Unable to reach payment provider. Please try again or enter manually.",
              requiresManualEntry: true,
            },
            { status: 503 }
          );
        }

        return NextResponse.json(
          { error: "Verification failed. Please try again." },
          { status: 500 }
        );
      }
    }

    // Action 2: Save account name manually
    if (action === "saveManual") {
      if (!accountName || !driverId) {
        return NextResponse.json(
          { error: "Account name and driver ID are required" },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from("drivers")
        .update({
          account_name: accountName.trim(),
          updated_at: new Date(),
        })
        .eq("id", driverId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to save account name" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        accountName: accountName.trim(),
        message: "Account name saved successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Account verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
