<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns';

const { data: notifications, refresh } = useFetch('/api/me/notifications');

const unreadCount = computed(() => notifications.value?.filter((n) => !n.read).length || 0);

// Sort notifications: unread first, then by date
const sortedNotifications = computed(() => {
  if (!notifications.value) return [];
  return [...notifications.value].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

async function respond(notification: any, accept: boolean) {
  try {
    const res = await $fetch(`/api/notifications/${notification.id}/respond`, {
      method: 'POST',
      body: { accept },
    });

    if (res.message) {
      useToast().add({ title: res.message, color: 'orange' });
    } else {
      useToast().add({
        title: accept ? 'Invite Accepted!' : 'Invite Rejected',
        color: accept ? 'green' : 'gray',
      });
      if (accept) {
        window.location.reload();
      }
    }
    await refresh();
  } catch (err: any) {
    useToast().add({ title: 'Error', description: err.message, color: 'red' });
  }
}

function getModeIcon(mode: string) {
  return mode === 'buddy' ? 'i-heroicons-user-group' : 'i-heroicons-eye';
}

function getModeColor(mode: string) {
  return mode === 'buddy' ? 'text-primary-400' : 'text-blue-400';
}

// Mark a notification as read (for notifications without actions like reactions)
async function markAsRead(notification: any) {
  if (notification.read) return;

  try {
    await $fetch(`/api/notifications/${notification.id}/read`, {
      method: 'POST',
    });
    await refresh();
  } catch (err) {
    // Silently fail - not critical
  }
}
</script>

<template>
  <UPopover
    :popper="{ placement: 'bottom-end', offsetDistance: 8 }"
    :ui="{
      ring: 'ring-1 ring-white/10',
      background: 'bg-neutral-900/95 backdrop-blur-xl',
      shadow: 'shadow-2xl shadow-black/50',
      rounded: 'rounded-xl'
    }"
  >
    <!-- Trigger Button -->
    <UButton color="gray" variant="ghost" class="relative group">
      <UIcon
        name="i-heroicons-bell-20-solid"
        class="h-5 w-5 text-white/50 group-hover:text-white transition-colors duration-200"
      />
      <!-- Badge with pulse animation for unread -->
      <span
        v-if="unreadCount > 0"
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white ring-2 ring-neutral-900 px-1"
      >
        <span class="absolute inset-0 rounded-full bg-primary-500 animate-ping opacity-40"></span>
        <span class="relative">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
      </span>
    </UButton>

    <template #panel>
      <div class="w-[calc(100vw-2rem)] sm:w-96 flex flex-col max-h-[70vh] sm:max-h-[32rem] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-bell" class="w-4 h-4 text-white/40" />
            <h3 class="font-semibold text-white/90 text-sm">Notifications</h3>
          </div>
          <span
            v-if="unreadCount > 0"
            class="text-[11px] font-medium text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full"
          >
            {{ unreadCount }} new
          </span>
          <span v-else class="text-[11px] text-white/30">All caught up</span>
        </div>

        <!-- Empty State -->
        <div v-if="!notifications?.length" class="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <UIcon name="i-heroicons-bell-slash" class="w-6 h-6 text-white/20" />
          </div>
          <div>
            <p class="text-sm text-white/50 font-medium">No notifications yet</p>
            <p class="text-xs text-white/30 mt-0.5">We'll notify you when something arrives</p>
          </div>
        </div>

        <!-- Notifications List -->
        <div v-else class="overflow-y-auto flex-1 p-2">
          <TransitionGroup name="notification" tag="div" class="space-y-1.5">
            <div
              v-for="notification in sortedNotifications"
              :key="notification.id"
              class="relative rounded-xl p-3 text-sm transition-all duration-300 group"
              :class="[
                notification.read
                  ? 'opacity-50 hover:opacity-70 bg-transparent'
                  : 'bg-white/[0.04] hover:bg-white/[0.06] border border-white/5'
              ]"
            >
              <!-- Unread Indicator Dot -->
              <div
                v-if="!notification.read"
                class="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.4)]"
              ></div>

              <!-- Share Invite -->
              <div v-if="notification.type === 'share_invite'" class="flex flex-col gap-2 pl-2">
                <div class="flex items-start gap-3">
                  <!-- Avatar with mode indicator -->
                  <div class="relative">
                    <UAvatar
                      :alt="notification.data.senderName.charAt(0).toUpperCase()"
                      size="sm"
                      :ui="{
                        background: notification.read ? 'bg-white/10' : 'bg-primary-500/20',
                        text: notification.read ? 'text-white/40' : 'text-primary-400',
                        rounded: 'rounded-lg'
                      }"
                    />
                    <div
                      class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      :class="notification.read ? 'bg-white/10' : 'bg-neutral-800 ring-1 ring-white/10'"
                    >
                      <UIcon
                        :name="getModeIcon(notification.data.mode)"
                        class="w-2.5 h-2.5"
                        :class="notification.read ? 'text-white/30' : getModeColor(notification.data.mode)"
                      />
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="leading-snug" :class="notification.read ? 'text-white/40' : 'text-white/80'">
                      <span :class="notification.read ? 'font-medium text-white/50' : 'font-semibold text-white'">
                        {{ notification.data.senderName }}
                      </span>
                      <span class="text-white/50"> invited you to </span>
                      <span :class="notification.read ? 'font-medium text-white/50' : 'font-medium text-white'">
                        {{ notification.data.habitTitle }}
                      </span>
                    </p>

                    <!-- Mode badge -->
                    <div class="flex items-center gap-2 mt-1.5">
                      <span
                        class="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md capitalize"
                        :class="notification.read
                          ? 'bg-white/5 text-white/30'
                          : notification.data.mode === 'buddy'
                            ? 'bg-primary-500/10 text-primary-400'
                            : 'bg-blue-500/10 text-blue-400'"
                      >
                        <UIcon :name="getModeIcon(notification.data.mode)" class="w-2.5 h-2.5" />
                        {{ notification.data.mode }} mode
                      </span>
                      <span class="text-[10px] text-white/30">
                        {{ formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons (only for unread) -->
                <div v-if="!notification.read" class="flex gap-2 mt-1 ml-11">
                  <UButton
                    size="xs"
                    color="primary"
                    variant="solid"
                    @click="respond(notification, true)"
                    class="flex-1 justify-center font-medium"
                    :ui="{ rounded: 'rounded-lg' }"
                  >
                    <UIcon name="i-heroicons-check" class="w-3.5 h-3.5 mr-1" />
                    Accept
                  </UButton>
                  <UButton
                    size="xs"
                    color="gray"
                    variant="ghost"
                    @click="respond(notification, false)"
                    class="flex-1 justify-center font-medium hover:bg-white/10"
                    :ui="{ rounded: 'rounded-lg' }"
                  >
                    Decline
                  </UButton>
                </div>

                <!-- Responded status (for read) -->
                <div v-else class="flex items-center gap-1.5 ml-11 mt-0.5">
                  <UIcon name="i-heroicons-check-circle-solid" class="w-3.5 h-3.5 text-white/20" />
                  <span class="text-[11px] text-white/30">Responded</span>
                </div>
              </div>

              <!-- Reaction Notification -->
              <div
                v-else-if="notification.type === 'reaction'"
                class="flex items-start gap-3 pl-2 cursor-pointer"
                @click="markAsRead(notification)"
              >
                <div
                  class="flex items-center justify-center w-9 h-9 rounded-lg text-xl transition-colors"
                  :class="notification.read ? 'bg-white/5' : 'bg-white/10'"
                >
                  {{ notification.data.reaction }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="leading-snug" :class="notification.read ? 'text-white/40' : 'text-white/80'">
                    <span :class="notification.read ? 'font-medium text-white/50' : 'font-semibold text-white'">
                      {{ notification.data.senderName }}
                    </span>
                    <span class="text-white/50"> reacted to </span>
                    <span :class="notification.read ? 'font-medium text-white/50' : 'font-medium text-white'">
                      {{ notification.data.habitTitle }}
                    </span>
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] text-white/30">
                      {{ formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) }}
                    </span>
                    <span v-if="!notification.read" class="text-[10px] text-primary-400/60">Click to dismiss</span>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
/* Notification list transitions */
.notification-move,
.notification-enter-active,
.notification-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(16px) scale(0.98);
}

.notification-leave-active {
  position: absolute;
  width: calc(100% - 16px);
}

/* Smooth scrollbar */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
