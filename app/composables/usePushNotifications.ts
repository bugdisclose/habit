export function usePushNotifications() {
  const config = useRuntimeConfig();
  const isSupported = ref(false);
  const isSubscribed = ref(false);
  const permission = ref<NotificationPermission>('default');
  const loading = ref(false);

  // Check if push is supported
  onMounted(() => {
    isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window;
    if ('Notification' in window) {
      permission.value = Notification.permission;
    }
    checkSubscription();
  });

  // Check if already subscribed
  async function checkSubscription() {
    if (!isSupported.value) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      isSubscribed.value = !!subscription;
    } catch (e) {
      console.error('Error checking subscription:', e);
    }
  }

  // Request permission and subscribe
  async function subscribe() {
    if (!isSupported.value) return { success: false, error: 'Not supported' };
    loading.value = true;

    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      permission.value = perm;
      
      if (perm !== 'granted') {
        loading.value = false;
        return { success: false, error: 'Permission denied' };
      }

      // Register service worker if needed
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.public.vapidPublicKey),
      });

      // Send subscription to server
      const response = await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: subscription.toJSON(),
      });

      isSubscribed.value = true;
      loading.value = false;
      return { success: true };
    } catch (e: any) {
      console.error('Subscribe error:', e);
      loading.value = false;
      return { success: false, error: e.message };
    }
  }

  // Unsubscribe
  async function unsubscribe() {
    if (!isSupported.value) return;
    loading.value = true;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await $fetch('/api/push/unsubscribe', {
          method: 'POST',
          body: { endpoint: subscription.endpoint },
        });
      }

      isSubscribed.value = false;
    } catch (e) {
      console.error('Unsubscribe error:', e);
    }
    loading.value = false;
  }

  // Test notification
  async function sendTestNotification() {
    try {
      await $fetch('/api/push/test', { method: 'POST' });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

