<script setup lang="ts">
import type { BadgeDefinition } from '../../shared/badges';

const props = defineProps<{
  login: string;
  isMyProfile?: boolean;
}>();

const expanded = ref(false);

// Compute the endpoint based on whether viewing own profile
const badgesEndpoint = computed(() =>
  props.isMyProfile ? '/api/badges' : `/api/users/${props.login}/badges`
);

// Use useFetch with server: false to ensure client-side fetch with proper credentials
const { data: badgesData, status } = useFetch(badgesEndpoint, {
  key: `badges-${props.login}-${props.isMyProfile}`,
  default: () => ({ badges: [], stats: { total: 0, earned: 0, percentage: 0 } }),
  server: false, // Fetch only on client side to ensure proper session handling
  lazy: true,
});

const isPending = computed(() => status.value === 'pending');

const earnedBadges = computed(() => {
  if (!badgesData.value?.badges) return [];
  return badgesData.value.badges.filter((b: any) => b.earned);
});

// Get the next badge to unlock (first unearned badge)
const nextBadgeToUnlock = computed(() => {
  if (!badgesData.value?.badges) return null;
  return badgesData.value.badges.find((b: any) => !b.earned) || null;
});

const recentBadges = computed(() => earnedBadges.value.slice(0, 5)); // Show 5 to leave room for upcoming
</script>

<template>
  <!-- Subtle inline badges row -->
  <div v-if="earnedBadges.length > 0 || isMyProfile" class="flex items-center gap-2">
    <!-- Badge icons row -->
    <div class="flex items-center gap-1">
      <template v-if="earnedBadges.length > 0 || nextBadgeToUnlock">
        <!-- Earned badges -->
        <UTooltip
          v-for="badge in recentBadges"
          :key="badge.id"
          :text="badge.description"
          :arrow="true"
        >
          <span
            class="text-sm opacity-70 hover:opacity-100 transition cursor-default"
          >{{ badge.icon }}</span>
        </UTooltip>

        <!-- Next badge to unlock (only show on own profile) -->
        <UTooltip
          v-if="isMyProfile && nextBadgeToUnlock"
          :text="`Next: ${nextBadgeToUnlock.description}`"
          :arrow="true"
        >
          <span
            class="text-sm opacity-30 hover:opacity-50 transition cursor-default grayscale"
          >{{ nextBadgeToUnlock.icon }}</span>
        </UTooltip>

        <button
          v-if="earnedBadges.length > 5"
          @click="expanded = !expanded"
          class="text-[10px] text-white/40 hover:text-white/60 transition ml-1"
        >
          +{{ earnedBadges.length - 5 }}
        </button>
      </template>
      <span v-else-if="isMyProfile" class="text-xs text-white/30 italic">No badges yet</span>
    </div>

    <!-- Stats (subtle) -->
    <div v-if="badgesData?.stats && badgesData.stats.earned > 0" class="flex items-center gap-1.5 text-[10px] text-white/30">
      <span>{{ badgesData.stats.earned }}/{{ badgesData.stats.total }}</span>
    </div>
  </div>

  <!-- Expanded view (modal-like dropdown) -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="expanded"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click="expanded = false"
      >
        <div
          class="mx-4 max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-neutral-900 p-4 shadow-2xl"
          @click.stop
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium text-white/70">Achievements</span>
            <button @click="expanded = false" class="text-white/40 hover:text-white/70">
              <UIcon name="i-heroicons-x-mark-20-solid" class="h-5 w-5" />
            </button>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <UTooltip
              v-for="badge in earnedBadges"
              :key="badge.id"
              :text="badge.description"
              :arrow="true"
            >
              <div
                class="flex flex-col items-center gap-1 rounded-lg bg-white/5 p-2 text-center cursor-default"
              >
                <span class="text-lg">{{ badge.icon }}</span>
                <span class="text-[9px] text-white/50 leading-tight">{{ badge.name }}</span>
              </div>
            </UTooltip>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

