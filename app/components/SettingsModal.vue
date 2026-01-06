<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const toast = useToast();
const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe, sendTestNotification } = usePushNotifications();

// Calendar state
const calendarLoading = ref(false);
const calendarUrl = ref<string | null>(null);

// Notification settings
const reminderTime = ref('09:00');
const eveningNudge = ref(true);
const eveningNudgeTime = ref('20:00');

// Load settings on open
watch(isOpen, async (open) => {
  if (open) {
    try {
      const data = await $fetch('/api/settings');
      if (data.calendarUrl) calendarUrl.value = data.calendarUrl;
      if (data.reminderTime) reminderTime.value = data.reminderTime;
      if (data.eveningNudge !== undefined) eveningNudge.value = data.eveningNudge;
      if (data.eveningNudgeTime) eveningNudgeTime.value = data.eveningNudgeTime;
    } catch (e) {
      // Ignore - user might not have settings yet
    }
  }
});

// Generate calendar subscription
async function generateCalendar() {
  calendarLoading.value = true;
  try {
    const data = await $fetch('/api/settings/calendar', { method: 'POST' });
    calendarUrl.value = data.calendarUrl;
    toast.add({ title: 'Calendar ready!', icon: 'i-heroicons-calendar' });
  } catch (e) {
    toast.add({ title: 'Failed to generate', color: 'red' });
  }
  calendarLoading.value = false;
}

// Copy calendar URL
function copyCalendarUrl() {
  if (!calendarUrl.value) return;
  const fullUrl = window.location.origin + calendarUrl.value;
  navigator.clipboard.writeText(fullUrl);
  toast.add({ title: 'Copied!', icon: 'i-heroicons-clipboard-document-check' });
}

// Subscribe to calendar (opens webcal:// for iOS)
function subscribeToCalendar() {
  if (!calendarUrl.value) return;
  const fullUrl = window.location.origin + calendarUrl.value;
  const webcalUrl = fullUrl.replace('https://', 'webcal://').replace('http://', 'webcal://');
  window.open(webcalUrl, '_blank');
}

// Handle push subscription toggle
async function togglePush() {
  if (isSubscribed.value) {
    await unsubscribe();
    toast.add({ title: 'Notifications off', icon: 'i-heroicons-bell-slash' });
  } else {
    const result = await subscribe();
    if (result.success) {
      toast.add({ title: 'Notifications on!', icon: 'i-heroicons-bell' });
    } else {
      toast.add({ title: result.error || 'Failed', color: 'red' });
    }
  }
}

// Test notification
async function testPush() {
  try {
    const result = await sendTestNotification();
    if (result.success) {
      toast.add({ title: 'Sent!', icon: 'i-heroicons-bell-alert' });
    } else {
      toast.add({ title: result.error || 'Failed', color: 'red' });
    }
  } catch (e: any) {
    toast.add({ title: 'Error sending', color: 'red' });
  }
}

// Save notification settings
async function saveSettings() {
  try {
    await $fetch('/api/settings', {
      method: 'PATCH',
      body: {
        reminderTime: reminderTime.value,
        eveningNudge: eveningNudge.value,
        eveningNudgeTime: eveningNudgeTime.value,
      },
    });
    toast.add({ title: 'Saved', icon: 'i-heroicons-check' });
  } catch (e) {
    toast.add({ title: 'Failed to save', color: 'red' });
  }
}
</script>

<template>
  <UModal v-model="isOpen" :ui="{ width: 'w-full max-w-sm', rounded: 'rounded-2xl', background: 'bg-neutral-900', container: 'items-start sm:items-center pt-16 sm:pt-0' }">
    <div class="p-4 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-white">Reminders</h2>
        <button @click="isOpen = false" class="text-white/40 hover:text-white">
          <UIcon name="i-heroicons-x-mark-20-solid" class="w-5 h-5" />
        </button>
      </div>

      <!-- Push Notifications Section (moved to top for keyboard accessibility) -->
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-white text-sm">
          <UIcon name="i-heroicons-bell" class="w-4 h-4 text-primary-500" />
          <span class="font-medium">Push Notifications</span>
        </div>

        <div v-if="isSupported" class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-white/70">Enable notifications</span>
            <UToggle :model-value="isSubscribed" @update:model-value="togglePush" :disabled="loading" />
          </div>

          <template v-if="isSubscribed">
            <div class="flex items-center justify-between">
              <span class="text-sm text-white/70">Morning reminder</span>
              <div class="time-input">
                <input
                  v-model="reminderTime"
                  type="time"
                  @change="saveSettings"
                />
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-white/70">Evening nudge</span>
              <div class="flex items-center gap-2">
                <div v-if="eveningNudge" class="time-input">
                  <input
                    v-model="eveningNudgeTime"
                    type="time"
                    @change="saveSettings"
                  />
                </div>
                <UToggle v-model="eveningNudge" @update:model-value="saveSettings" />
              </div>
            </div>

            <button
              @click="testPush"
              class="button w-full bg-white/10 hover:bg-white/15 text-white px-3 py-2.5 text-sm"
            >
              Test Notification
            </button>
          </template>
        </div>

        <div v-else class="text-xs text-white/40 space-y-1">
          <p>To enable notifications on iPhone:</p>
          <ol class="list-decimal list-inside space-y-0.5">
            <li>Add app to Home Screen (Share → Add)</li>
            <li>Open from Home Screen</li>
            <li>Return here to enable</li>
          </ol>
        </div>
      </div>

      <div class="border-t border-white/10" />

      <!-- Calendar Section -->
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-white text-sm">
          <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-primary-500" />
          <span class="font-medium">Calendar Widget</span>
        </div>
        <p class="text-xs text-white/50">
          Add habits to iPhone Calendar widget
        </p>

        <div v-if="!calendarUrl">
          <button
            @click="generateCalendar"
            :disabled="calendarLoading"
            class="w-full bg-white/10 hover:bg-white/15 text-white px-3 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2"
          >
            <UIcon v-if="calendarLoading" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <span>{{ calendarLoading ? 'Generating...' : 'Generate Link' }}</span>
          </button>
        </div>

        <div v-else class="flex gap-2">
          <button
            @click="subscribeToCalendar"
            class="flex-1 bg-primary-600 hover:bg-primary-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
          >
            Add to Calendar
          </button>
          <button
            @click="copyCalendarUrl"
            class="bg-white/10 hover:bg-white/15 text-white px-3 py-2 rounded-lg text-sm transition"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  </UModal>
</template>

<style lang="postcss" scoped>
.time-input {
  @apply relative;

  input {
    @apply bg-white/10 rounded-full px-3 py-1.5 text-sm text-white text-center w-24 outline-none transition-all;
    box-shadow:
      inset 0.5px 0.5px 1px 0px rgba(255, 255, 255, 0.1),
      inset -0.5px -0.5px 1px 0px rgba(0, 0, 0, 0.1),
      rgba(0, 0, 0, 0.2) 0px 3px 10px -5px;

    &:focus {
      @apply bg-white/15 ring-1 ring-primary-500/50;
    }

    &::-webkit-calendar-picker-indicator {
      @apply hidden;
    }
  }
}
</style>
