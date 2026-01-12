import { supabaseAdmin } from "@/lib/supabase";

export interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type: "system" | "ride" | "payment" | "admin";
  channel: "in_app" | "push" | "sms" | "email";
  related_table?: string;
  related_id?: string;
}

/**
 * Create notification in database
 * Supabase triggers will handle sending SMS/Email via Termii
 */
export async function createNotification(payload: NotificationPayload) {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert([
        {
          user_id: payload.user_id,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          channel: payload.channel,
          related_table: payload.related_table,
          related_id: payload.related_id,
          read: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Notification creation error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Fetch unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("read", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) {
      console.error("Error marking notification as read:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return null;
  }
}

/**
 * Notify driver about new ride
 */
export async function notifyDriverAboutRide(
  driverId: string,
  rideId: string,
  pickup: string,
  destination: string
) {
  return createNotification({
    user_id: driverId,
    title: "New Ride Available",
    message: `From ${pickup} to ${destination}`,
    type: "ride",
    channel: "push",
    related_table: "rides",
    related_id: rideId,
  });
}

/**
 * Notify rider about ride status change
 */
export async function notifyRiderAboutRideStatus(
  riderId: string,
  rideId: string,
  status: string
) {
  const statusMessages: Record<string, string> = {
    dispatched: "A driver is being matched for your ride",
    accepted: "Your ride has been accepted",
    in_progress: "Your ride is in progress",
    completed: "Your ride is complete",
    cancelled: "Your ride has been cancelled",
  };

  return createNotification({
    user_id: riderId,
    title: `Ride ${status}`,
    message: statusMessages[status] || "Your ride status has changed",
    type: "ride",
    channel: "push",
    related_table: "rides",
    related_id: rideId,
  });
}

/**
 * Notify user about payment
 */
export async function notifyUserAboutPayment(
  userId: string,
  amount: number,
  type: "credit" | "debit"
) {
  const action = type === "credit" ? "credited" : "debited";
  return createNotification({
    user_id: userId,
    title: `Payment ${type === "credit" ? "Received" : "Processed"}`,
    message: `₦${amount} has been ${action} to your wallet`,
    type: "payment",
    channel: "push",
  });
}
