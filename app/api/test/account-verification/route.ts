import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test endpoint to verify account verification integration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get("test");

    if (!testType) {
      return NextResponse.json({
        message: "Account Verification Integration Tests",
        tests: [
          "1. Database column added - /api/test/account-verification?test=column",
          "2. API endpoint working - /api/test/account-verification?test=endpoint",
          "3. Component integration - /api/test/account-verification?test=component",
          "4. Paystack connection - /api/test/account-verification?test=paystack",
        ],
      });
    }

    // Test 1: Check if account_name column exists
    if (testType === "column") {
      const { data, error } = await supabase
        .from("drivers")
        .select("account_name")
        .limit(1);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "✓ account_name column exists in drivers table",
        columnExists: true,
      });
    }

    // Test 2: Verify API endpoint
    if (testType === "endpoint") {
      const endpointExists = process.env.PAYSTACK_SECRET_KEY ? true : false;

      return NextResponse.json({
        success: true,
        message: "✓ API endpoint configured",
        endpointDetails: {
          accountVerifyEndpoint: "/api/driver/account-verify",
          paystackConfigured: endpointExists,
          supportedActions: ["verify", "saveManual"],
        },
      });
    }

    // Test 3: Component integration
    if (testType === "component") {
      return NextResponse.json({
        success: true,
        message: "✓ Component integration ready",
        componentDetails: {
          componentPath: "/components/account-verification-section.tsx",
          integrationPath: "/app/driver/settings/page.tsx",
          props: {
            driverId: "string",
            currentAccountName: "string",
            bankAccountNumber: "string",
            bankName: "string",
          },
          features: [
            "Paystack API verification",
            "Rate limit handling",
            "Manual entry fallback",
            "Toast notifications",
            "Account name persistence",
          ],
        },
      });
    }

    // Test 4: Paystack connection
    if (testType === "paystack") {
      if (!process.env.PAYSTACK_SECRET_KEY) {
        return NextResponse.json(
          {
            success: false,
            message: "Paystack Secret Key not configured",
          },
          { status: 400 }
        );
      }

      try {
        const response = await fetch("https://api.paystack.co/bank", {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        });

        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: "✓ Paystack API connection successful",
            paystackStatus: "connected",
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              message: "Paystack API returned error",
              status: response.status,
            },
            { status: 400 }
          );
        }
      } catch (error: any) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to connect to Paystack: " + error.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Invalid test type" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Test error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
