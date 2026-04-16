import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/drivers/[id]
 * Fetch driver details by driver ID (UUID)
 * 
 * Used by: Rating screen to fetch driver information for a completed ride
 * Parameters: id (driver UUID)
 * 
 * Response:
 * - id: driver UUID
 * - user_id: reference to users table
 * - vehicle_type: e.g., "Keke", "Car"
 * - plate_number: vehicle registration plate
 * - vehicle_picture_url: URL to vehicle photo
 * - average_rating: driver's average rating (0-5)
 * - users: user information (name, profile picture, etc.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: driverId } = await params;

  try {
    console.log(`[Drivers API] Fetching driver details for ID: ${driverId}`);

    // Validate driver ID format
    if (!driverId || typeof driverId !== 'string') {
      return NextResponse.json(
        { error: "Invalid driver ID" },
        { status: 400 }
      );
    }

    // Query drivers table with joined users data
    const { data: driver, error } = await supabaseAdmin!
      .from("drivers")
      .select(
        `
        id,
        user_id,
        vehicle_type,
        plate_number,
        vehicle_picture_url,
        license_picture_url,
        average_rating,
        total_rides_completed,
        verified,
        users:user_id (
          id,
          first_name,
          last_name,
          phone_number,
          profile_picture_url,
          email,
          role
        )
      `
      )
      .eq("id", driverId)
      .single();

    if (error) {
      console.error(`[Drivers API] Database query error for ${driverId}:`, error);
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    if (!driver) {
      console.warn(`[Drivers API] No driver found with ID: ${driverId}`);
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    console.log(`[Drivers API] Successfully fetched driver: ${driver.users?.first_name} ${driver.users?.last_name}`);

    // Return driver data with users info included
    return NextResponse.json({
      id: driver.id,
      user_id: driver.user_id,
      vehicle_type: driver.vehicle_type,
      plate_number: driver.plate_number,
      vehicle_picture_url: driver.vehicle_picture_url,
      license_picture_url: driver.license_picture_url,
      average_rating: driver.average_rating,
      total_rides_completed: driver.total_rides_completed,
      verified: driver.verified,
      users: driver.users ? {
        id: driver.users.id,
        first_name: driver.users.first_name,
        last_name: driver.users.last_name,
        phone_number: driver.users.phone_number,
        profile_picture_url: driver.users.profile_picture_url,
        email: driver.users.email,
        role: driver.users.role,
      } : null,
    });

  } catch (error) {
    console.error(`[Drivers API] Unexpected error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
