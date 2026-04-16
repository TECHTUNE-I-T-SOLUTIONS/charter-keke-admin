import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

/**
 * GET /api/chat/user
 * Get all chats for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all chats where user is rider or driver
    const { data: chats, error: chatsError } = await supabaseAdmin!
      .from("chats")
      .select(
        `
        id,
        ride_id,
        rider_id,
        driver_id,
        created_at,
        updated_at,
        rides (
          id,
          status,
          pickup_zone,
          destination_zone
        ),
        messages (
          id,
          content,
          message_type,
          sender_id,
          sent_at,
          read_by_rider,
          read_by_driver,
          users!messages_sender_id_fkey (
            id,
            first_name,
            last_name,
            profile_picture_url
          )
        )
      `
      )
      .or(`rider_id.eq.${session.user.id},driver_id.eq.${session.user.id}`)
      .order("updated_at", { ascending: false });

    if (chatsError) {
      console.error("Chats fetch error:", chatsError);
      return NextResponse.json(
        { error: "Failed to fetch chats" },
        { status: 500 }
      );
    }

    // Get rider and driver details for each chat
    const enrichedChats = await Promise.all(
      chats.map(async (chat: any) => {
        let riderData = null;
        let driverData = null;

        // Fetch rider details
        if (chat.rider_id) {
          const { data: rider } = await supabaseAdmin!
            .from("users")
            .select("id, first_name, last_name, profile_picture_url")
            .eq("id", chat.rider_id)
            .single();
          riderData = rider;
        }

        // Fetch driver details (need to get user_id from drivers table first)
        if (chat.driver_id) {
          const { data: driver } = await supabaseAdmin!
            .from("drivers")
            .select("user_id")
            .eq("id", chat.driver_id)
            .single();

          if (driver?.user_id) {
            const { data: driverUser } = await supabaseAdmin!
              .from("users")
              .select("id, first_name, last_name, profile_picture_url")
              .eq("id", driver.user_id)
              .single();
            driverData = driverUser;
          }
        }

        const messages = chat.messages || [];
        const lastMessage = messages[messages.length - 1];

        // Determine if current user is rider or driver
        const isRider = chat.rider_id === session.user.id;

        // Calculate unread count based on read_by_rider/read_by_driver
        const unreadCount = messages.filter(
          (msg: any) =>
            msg.sender_id !== session.user.id &&
            (isRider ? !msg.read_by_rider : !msg.read_by_driver)
        ).length;

        return {
          id: chat.id,
          ride_id: chat.ride_id,
          rider_id: chat.rider_id,
          driver_id: chat.driver_id,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          ride: chat.rides,
          rider: riderData,
          driver: driverData,
          last_message: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                message_type: lastMessage.message_type,
                sender_id: lastMessage.sender_id,
                sent_at: lastMessage.sent_at,
                user: lastMessage.users,
              }
            : null,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ chats: enrichedChats });
  } catch (error) {
    console.error("[GET /api/chat/user] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
