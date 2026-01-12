import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromRequest(request);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized"}, {status: 401 });
        }

        const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

        if (error || !user) {
            return NextResponse.json({ error: "User not found"}, { status: 404 });
        }

        const { data: wallet } = await supabaseAdmin
        .from("wallets")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

        let driver = null;
        if (user.role === "driver") {
            const { data: driverData } = await supabaseAdmin
                .from("drivers")
                .select("*")
                .eq("user_id", session.user.id)
                .single();
            driver = driverData;
        }

        return NextResponse.json({
            user,
            wallet,
            driver,
        })
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


export async function PUT(request: NextRequest) {
    try {
        const session = await getSessionFromRequest(request);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const { data: updatedUser, error } = await supabaseAdmin
        .from("users")
        .update(body)
        .eq("id", session.user.id)
        .select()
        .single();

        if (error) {
            return NextResponse.json(
                { error: "Failed to update profile" },
                { status: 500 }
            );
        }


        return NextResponse.json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}