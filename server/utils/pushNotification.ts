import webpush from 'web-push';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
  const config = useRuntimeConfig();
  const db = useDB();

  if (!config.vapidPrivateKey || !config.public.vapidPublicKey) {
    console.warn('VAPID keys not configured');
    return { success: false, error: 'VAPID not configured' };
  }

  webpush.setVapidDetails(
    'mailto:hello@habit.app',
    config.public.vapidPublicKey,
    config.vapidPrivateKey
  );

  // Get all push subscriptions for user
  const subscriptions = await db
    .select()
    .from(tables.pushSubscriptions)
    .where(eq(tables.pushSubscriptions.userId, userId))
    .all();

  if (subscriptions.length === 0) {
    return { success: false, error: 'No subscriptions' };
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon-192.png',
            badge: payload.badge || '/icon-192.png',
            tag: payload.tag,
            data: payload.data,
          })
        );
        return { endpoint: sub.endpoint, success: true };
      } catch (error: any) {
        // Remove invalid subscriptions (410 Gone or 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db
            .delete(tables.pushSubscriptions)
            .where(eq(tables.pushSubscriptions.endpoint, sub.endpoint));
        }
        return { endpoint: sub.endpoint, success: false, error: error.message };
      }
    })
  );

  return { success: true, results };
}

