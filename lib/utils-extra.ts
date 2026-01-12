/**
 * Charter Keke Utility Functions
 * Centralized helper functions for common operations
 */

import { supabaseAdmin } from "@/lib/supabase";

/**
 * Calculate ride fare based on zones
 * TODO: Implement actual distance-based calculation
 */
export function calculateFare(
  pickupZone: string,
  destinationZone: string,
  rideType: "single" | "shared" | "delivery" = "single"
): number {
  // Base fare structure (in NGN)
  const baseFare = 500;
  const perZoneFare = 300;

  // This is a placeholder - implement actual pricing logic
  const zoneDifference = 1; // TODO: Calculate from zone mapping
  let fare = baseFare + zoneDifference * perZoneFare;

  // Adjust for ride type
  if (rideType === "shared") {
    fare = Math.floor(fare * 0.7); // 30% discount for shared rides
  } else if (rideType === "delivery") {
    fare = Math.floor(fare * 1.5); // 50% premium for delivery
  }

  return fare;
}

/**
 * Check if a driver is available for a ride
 */
export async function isDriverAvailable(
  driverId: string,
  pickupZone: string
): Promise<boolean> {
  const { data: driver } = await supabaseAdmin
    .from("drivers")
    .select("availability_status, operating_zones")
    .eq("id", driverId)
    .single();

  if (!driver) return false;

  return (
    driver.availability_status === "online" &&
    driver.operating_zones?.includes(pickupZone)
  );
}

/**
 * Get all drivers in a specific zone
 */
export async function getDriversInZone(zone: string, limit: number = 5) {
  const { data: drivers } = await supabaseAdmin
    .from("drivers")
    .select("*, users(first_name, last_name, phone_number)")
    .contains("operating_zones", [zone])
    .eq("availability_status", "online")
    .eq("verified", true)
    .limit(limit);

  return drivers || [];
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = "NGN"
): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate driver earnings from a ride
 */
export function calculateDriverEarnings(
  fare: number,
  commissionPercentage: number = 20
): number {
  return Math.floor(fare * (1 - commissionPercentage / 100));
}

/**
 * Validate phone number format (Nigerian numbers)
 */
export function validatePhoneNumber(phone: string): boolean {
  const nigerian = /^(\+234|0)[0-9]{10}$/;
  return nigerian.test(phone.replace(/\s+/g, ""));
}

/**
 * Format phone number to standard format
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "234" + cleaned.slice(1);
  } else if (!cleaned.startsWith("234")) {
    cleaned = "234" + cleaned;
  }
  return "+" + cleaned;
}

/**
 * Check if user has permission
 */
export async function hasAdminPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const { data: admin } = await supabaseAdmin
    .from("admins")
    .select("permissions")
    .eq("user_id", userId)
    .single();

  if (!admin) return false;

  const perms = admin.permissions as Record<string, boolean>;
  return perms[permission] === true;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
  adminId: string,
  action: string,
  targetTable: string,
  targetId: string,
  details: Record<string, any>
) {
  return supabaseAdmin.from("audit_logs").insert([
    {
      admin_id: adminId,
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
      created_at: new Date().toISOString(),
    },
  ]);
}

/**
 * Get ride distance (placeholder)
 * TODO: Implement with actual map distance API
 */
export function getDistance(
  pickupZone: string,
  destinationZone: string
): number {
  // Placeholder distance in kilometers
  return 5;
}

/**
 * Estimate ride time
 */
export function estimateRideTime(
  pickupZone: string,
  destinationZone: string
): number {
  // Placeholder estimation in minutes
  const distance = getDistance(pickupZone, destinationZone);
  return Math.ceil(distance * 2); // Assume 2 minutes per km
}
