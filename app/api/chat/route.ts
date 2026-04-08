import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rideId = searchParams.get('rideId');

    if (!rideId) {
      return NextResponse.json({ error: "Ride ID required" }, { status: 400 });
    }

    // Get chat for this ride
    const { data: chat, error: chatError } = await supabaseAdmin!
      .from("chats")
      .select(`
        id,
        ride_id,
        rider_id,
        driver_id,
        created_at,
        updated_at,
        rides (
          id,
          rider_id,
          driver_id,
          status
        )
      `)
      .eq('ride_id', rideId)
      .single();

    if (chatError && chatError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Chat fetch error:', chatError);
      return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 });
    }

    // Check if user is part of this ride
    if (chat) {
      const isParticipant = chat.rider_id === session.user.id || chat.driver_id === session.user.id;
      if (!isParticipant) {
        return NextResponse.json({ error: "Not authorized for this chat" }, { status: 403 });
      }
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rideId } = body;

    if (!rideId) {
      return NextResponse.json({ error: "Ride ID required" }, { status: 400 });
    }

    // Check if ride exists and user is participant
    const { data: ride, error: rideError } = await supabaseAdmin!
      .from("rides")
      .select('id, rider_id, driver_id, status')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    // Check if user is rider or driver
    const isRider = ride.rider_id === session.user.id;
    const isDriver = ride.driver_id === session.user.id;

    if (!isRider && !isDriver) {
      return NextResponse.json({ error: "Not authorized for this ride" }, { status: 403 });
    }

    // Check if ride is in appropriate status
    if (!['accepted', 'in_progress'].includes(ride.status)) {
      return NextResponse.json({ error: "Chat only available for active rides" }, { status: 400 });
    }

    // Check if chat already exists
    const { data: existingChat, error: existingError } = await supabaseAdmin!
      .from("chats")
      .select('id')
      .eq('ride_id', rideId)
      .single();

    if (existingChat) {
      return NextResponse.json({ chat: existingChat });
    }

    // Create new chat
    const { data: chat, error: chatCreateError } = await supabaseAdmin!
      .from("chats")
      .insert([{
        ride_id: rideId,
        rider_id: ride.rider_id,
        driver_id: ride.driver_id
      }])
      .select()
      .single();

    if (chatCreateError) {
      console.error('Chat creation error:', chatCreateError);
      return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}