<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns';

const { data: notifications, refresh } = useFetch('/api/me/notifications');

const unreadCount = computed(() => notifications.value?.filter((n) => !n.read).length || 0);

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
             // Reload to show the new habit (simple & robust)
             window.location.reload();
        }
    }
    await refresh();
  } catch (err: any) {
    useToast().add({ title: 'Error', description: err.message, color: 'red' });
  }
}
</script>

<template>
  <UPopover :popper="{ placement: 'bottom-end' }" :ui="{ ring: 'ring-1 ring-gray-800', background: 'bg-gray-900', shadow: 'shadow-xl' }">
    <UButton color="gray" variant="ghost" class="relative hover:bg-white/5 transition-colors">
      <UIcon name="i-heroicons-bell-20-solid" class="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
      <span
        v-if="unreadCount > 0"
        class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-gray-950"
      >
        {{ unreadCount }}
      </span>
    </UButton>

    <template #panel>
      <div class="w-80 flex flex-col max-h-[30rem]">
        <div class="flex items-center justify-between p-4 border-b border-white/5">
          <h3 class="font-semibold text-white">Notifications</h3>
          <span v-if="unreadCount > 0" class="text-xs text-gray-500">{{ unreadCount }} unread</span>
        </div>
        
        <div v-if="!notifications?.length" class="flex flex-col items-center justify-center py-10 text-center gap-2">
            <UIcon name="i-heroicons-bell-slash" class="w-8 h-8 text-gray-600" />
            <span class="text-sm text-gray-500">No new notifications</span>
        </div>

        <div v-else class="overflow-y-auto p-2 space-y-1">
          <TransitionGroup name="list" tag="div" class="space-y-1">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="relative rounded-lg p-3 text-sm transition-all hover:bg-white/5 group"
            :class="notification.read ? 'opacity-60' : 'bg-white/5 border border-white/5'"
          >
            <!-- Unread Indicator -->
            <div v-if="!notification.read" class="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(var(--color-primary-500),0.6)]"></div>

            <!-- Share Invite UI -->
            <div v-if="notification.type === 'share_invite'" class="flex flex-col gap-1.5">
              <div class="flex items-start gap-3">
                 <UAvatar :alt="notification.data.senderName.charAt(0).toUpperCase()" size="xs" :ui="{ background: 'bg-primary-500/20', text: 'text-primary-400' }" />
                 <div class="flex-1">
                    <p class="leading-snug text-gray-200">
                      <span class="font-semibold text-white">{{ notification.data.senderName }}</span>
                      invited you to join
                      <span class="font-medium text-white">{{ notification.data.habitTitle }}</span>
                    </p>
                    <p class="text-xs text-gray-500 mt-0.5 capitalize">
                      Mode: {{ notification.data.mode }}
                    </p>
                 </div>
              </div>
              
              <div v-if="!notification.read" class="mt-2 flex gap-2 pl-9">
                <UButton size="2xs" color="primary" variant="solid" @click="respond(notification, true)" class="flex-1 justify-center">Accept</UButton>
                <UButton size="2xs" color="gray" variant="soft" @click="respond(notification, false)" class="flex-1 justify-center">Decline</UButton>
              </div>
              <div v-else class="pl-9 mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <UIcon name="i-heroicons-check-circle" class="w-3 h-3" /> Responded
              </div>
            </div>

            <!-- Reaction UI -->
            <div v-else-if="notification.type === 'reaction'" class="flex items-start gap-3">
               <div class="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-lg">
                  {{ notification.data.reaction }}
               </div>
               <div class="flex-1">
                  <p class="leading-snug text-gray-200">
                    <span class="font-semibold text-white">{{ notification.data.senderName }}</span>
                    reacted to
                    <span class="font-medium text-white">{{ notification.data.habitTitle }}</span>
                  </p>
               </div>
            </div>

            <div class="mt-2 pl-9 text-[10px] text-gray-600 font-medium">
              {{ formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) }}
            </div>
          </div>
          </TransitionGroup>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
.list-leave-active {
  position: absolute;
}
</style>
