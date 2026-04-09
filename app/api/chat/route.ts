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

    // Get chat for this ride with participant details
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
          status,
          pickup_zone,
          destination_zone
        )
      `)
      .eq('ride_id', rideId)
      .single();

    // Get rider and driver details separately
    let riderData = null;
    let driverData = null;

    if (chat) {
      if (chat.rider_id) {
        const { data: rider } = await supabaseAdmin!
          .from("users")
          .select("id, first_name, last_name, profile_picture_url")
          .eq("id", chat.rider_id)
          .single();
        riderData = rider;
      }

      if (chat.driver_id) {
        const { data: driver } = await supabaseAdmin!
          .from("users")
          .select("id, first_name, last_name, profile_picture_url")
          .eq("id", chat.driver_id)
          .single();
        driverData = driver;
      }
    }

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

    return NextResponse.json({ 
      chat: {
        ...chat,
        rider: riderData,
        driver: driverData
      }
    });
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
      .select(`
        id, 
        rider_id, 
        driver_id, 
        status,
        drivers (
          id,
          user_id
        )
      `)
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      console.error('Ride fetch error:', rideError);
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    // Get the driver's user_id from the drivers table
    let driverUserId = null;
    if (ride.driver_id) {
      const { data: driver, error: driverError } = await supabaseAdmin!
        .from("drivers")
        .select('user_id')
        .eq('id', ride.driver_id)
        .single();

      if (!driverError && driver) {
        driverUserId = driver.user_id;
      }
    }

    // Check if user is rider or driver
    const isRider = ride.rider_id === session.user.id;
    const isDriver = driverUserId === session.user.id;

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

    // Verify both rider and driver (users) exist before creating chat
    if (ride.rider_id) {
      const { data: rider, error: riderError } = await supabaseAdmin!
        .from("users")
        .select('id')
        .eq('id', ride.rider_id)
        .single();

      if (riderError || !rider) {
        return NextResponse.json({ 
          error: "Rider not found in system" 
        }, { status: 404 });
      }
    }

    if (driverUserId) {
      const { data: driver, error: driverError } = await supabaseAdmin!
        .from("users")
        .select('id')
        .eq('id', driverUserId)
        .single();

      if (driverError || !driver) {
        return NextResponse.json({ 
          error: "Driver not found in system. Please ensure driver is accepting rides." 
        }, { status: 404 });
      }
    } else {
      return NextResponse.json({ 
        error: "Chat only available after driver accepts the ride" 
      }, { status: 400 });
    }

    // Create new chat with driver's user_id (not driver table id)
    const { data: chat, error: chatCreateError } = await supabaseAdmin!
      .from("chats")
      .insert([{
        ride_id: rideId,
        rider_id: ride.rider_id,
        driver_id: driverUserId  // Use driver's user_id, not driver table id
      }])
      .select()
      .single();

    if (chatCreateError) {
      console.error('Chat creation error:', chatCreateError);
      
      // More specific error messages
      if (chatCreateError.code === '23503') {
        return NextResponse.json({ 
          error: "Cannot create chat: driver or rider not found in system" 
        }, { status: 404 });
      }
      
      return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}