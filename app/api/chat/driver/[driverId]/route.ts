import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { driverId: string } }) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const driverId = params.driverId;

    // Verify the requesting user is the driver
    if (session.user.id !== driverId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get all chats for this driver
    const { data: chats, error: chatsError } = await supabaseAdmin!
      .from("chats")
      .select(`
        id,
        ride_id,
        rider_id,
        driver_id,
        created_at,
        updated_at,
        last_message: messages!chats_last_message_id_fkey (
          id,
          content,
          type,
          created_at,
          sender_id
        ),
        unread_count: messages!chats_id_fkey (
          id,
          read_by_driver
        ),
        rides (
          id,
          pickup_location,
          dropoff_location,
          status
        ),
        rider: users!chats_rider_id_fkey (
          id,
          name,
          phone
        )
      `)
      .eq('driver_id', driverId)
      .order('updated_at', { ascending: false });

    if (chatsError) {
      console.error('Chats fetch error:', chatsError);
      return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
    }

    // Process chats to include unread count and format data
    const processedChats = chats?.map(chat => {
      const unreadCount = chat.unread_count?.filter(msg => !msg.read_by_driver).length || 0;

      return {
        id: chat.id,
        ride_id: chat.ride_id,
        rider_id: chat.rider_id,
        driver_id: chat.driver_id,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        last_message: chat.last_message?.[0] || null,
        unread_count: unreadCount,
        ride: chat.rides,
        rider: chat.rider
      };
    }) || [];

    return NextResponse.json({ data: processedChats });
  } catch (error) {
    console.error('Driver chats GET error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}