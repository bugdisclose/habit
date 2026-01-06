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
  <!-- Subtle inline badges row - only show if badges exist -->
  <div v-if="earnedBadges.length > 0" class="flex items-center gap-1 flex-wrap mt-1">
    <!-- Earned badges -->
    <span
      v-for="badge in recentBadges"
      :key="badge.id"
      class="text-xs cursor-default"
      :title="badge.description"
    >{{ badge.icon }}</span>

    <!-- More badges indicator -->
    <button
      v-if="earnedBadges.length > 5"
      @click="expanded = !expanded"
      class="text-[10px] text-white/40 hover:text-white/60 transition"
    >
      +{{ earnedBadges.length - 5 }}
    </button>
  </div>

  <!-- Expanded view -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="expanded"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click="expanded = false"
      >
        <div
          class="max-h-[70vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-neutral-900 p-4 shadow-2xl"
          @click.stop
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium text-white/70">Achievements</span>
            <button @click="expanded = false" class="text-white/40 hover:text-white/70">
              <UIcon name="i-heroicons-x-mark-20-solid" class="h-5 w-5" />
            </button>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <div
              v-for="badge in earnedBadges"
              :key="badge.id"
              class="flex flex-col items-center gap-1 rounded-lg bg-white/5 p-2 text-center"
              :title="badge.description"
            >
              <span class="text-lg">{{ badge.icon }}</span>
              <span class="text-[9px] text-white/50 leading-tight">{{ badge.name }}</span>
            </div>
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

