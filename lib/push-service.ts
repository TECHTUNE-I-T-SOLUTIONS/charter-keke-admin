import webpush from 'web-push';

// Configure web-push with VAPID keys on server startup
export const initializePushNotifications = () => {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.warn('⚠️ [PUSH] VAPID keys not configured');
    return;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log('✅ [PUSH] Web push notifications initialized with VAPID keys');
};

/**
 * Interface for push notification subscription
 */
export interface PushSubscription {
  userId: string;
  pushToken: string;
  subscribedAt: string;
  platform: 'ios' | 'android' | 'web';
  role?: 'driver' | 'rider' | 'admin' | 'user';
}

/**
 * In-memory storage for active push subscriptions
 * TODO: In production, move this to database (Supabase)
 */
const activeSubscriptions = new Map<string, PushSubscription>();

/**
 * Store a new push subscription
 */
export const storePushSubscription = (subscription: PushSubscription) => {
  activeSubscriptions.set(subscription.userId, subscription);
  console.log('📡 [PUSH] Subscription stored for user:', subscription.userId);
  return subscription;
};

/**
 * Get all subscriptions for a user
 */
export const getUserSubscriptions = (userId: string): PushSubscription[] => {
  const subscription = activeSubscriptions.get(userId);
  return subscription ? [subscription] : [];
};

/**
 * Send push notification to specific users
 */
export const sendPushNotification = async (
  userIds: string[],
  payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
    categoryId?: string;
    type: 'ride_request' | 'ride_accepted' | 'ride_update' | 'support_message' | 'payment_received';
  }
) => {
  const results = [];

  for (const userId of userIds) {
    const subscriptions = getUserSubscriptions(userId);

    for (const subscription of subscriptions) {
      try {
        const notificationPayload = {
          title: payload.title,
          body: payload.body,
          data: {
            type: payload.type,
            timestamp: new Date().toISOString(),
            ...payload.data,
          },
        };

        // For mobile app (Expo)
        if (subscription.platform === 'ios' || subscription.platform === 'android') {
          await sendExpoNotification(subscription.pushToken, {
            ...notificationPayload,
            categoryId: payload.categoryId,
          });
        }
        // For web
        else if (subscription.platform === 'web') {
          await webpush.sendNotification(
            JSON.parse(subscription.pushToken),
            JSON.stringify(notificationPayload)
          );
        }

        console.log('✅ [PUSH] Notification sent to user:', userId, 'Platform:', subscription.platform);
        results.push({ userId, success: true });
      } catch (error: any) {
        console.error('❌ [PUSH] Failed to send notification:', error.message);
        results.push({ userId, success: false, error: error.message });
      }
    }
  }

  return results;
};

/**
 * Send Expo notification (for mobile app)
 */
const sendExpoNotification = async (
  expoPushToken: string,
  payload: {
    title: string;
    body: string;
    data: Record<string, any>;
    categoryId?: string;
  }
) => {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data,
      badge: 1,
      categoryId: payload.categoryId,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    console.log('✅ [PUSH] Expo notification sent successfully');
    return data;
  } catch (error) {
    console.error('❌ [PUSH] Expo notification error:', error);
    throw error;
  }
};

/**
 * Broadcast notification to all drivers
 */
export const broadcastToDrivers = async (
  payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
    type: string;
  },
  excludeUserIds: string[] = []
) => {
  console.log('📢 [PUSH] Broadcasting to drivers, excluding:', excludeUserIds);
  const driverIds = Array.from(activeSubscriptions.values())
    .filter((subscription) => subscription.role === 'driver' && !excludeUserIds.includes(subscription.userId))
    .map((subscription) => subscription.userId);
  return sendPushNotification(driverIds, {
    ...payload,
    type: payload.type as any,
  });
};

/**
 * Broadcast notification to all riders
 */
export const broadcastToRiders = async (
  payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
    type: string;
  },
  excludeUserIds: string[] = []
) => {
  console.log('📢 [PUSH] Broadcasting to riders, excluding:', excludeUserIds);
  const riderIds = Array.from(activeSubscriptions.values())
    .filter((subscription) => {
      const isRider = subscription.role === 'rider' || subscription.role === 'user';
      return isRider && !excludeUserIds.includes(subscription.userId);
    })
    .map((subscription) => subscription.userId);
  return sendPushNotification(riderIds, {
    ...payload,
    type: payload.type as any,
  });
};

/**
 * Remove subscription (on logout or error)
 */
export const removeSubscription = (userId: string) => {
  const hadSubscription = activeSubscriptions.has(userId);
  activeSubscriptions.delete(userId);
  if (hadSubscription) {
    console.log('✅ [PUSH] Subscription removed for user:', userId);
  }
};

/**
 * Get all active subscriptions count
 */
export const getActiveSubscriptionsCount = () => {
  return activeSubscriptions.size;
};

/**
 * Get subscription status
 */
export const getSubscriptionStatus = () => {
  return {
    activeSubscriptions: activeSubscriptions.size,
    subscriptionsList: Array.from(activeSubscriptions.entries()).map(([userId, sub]) => ({
      userId,
      platform: sub.platform,
      subscribedAt: sub.subscribedAt,
    })),
  };
};
