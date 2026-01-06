<script setup lang="ts">
import { getTierColor, getTierBgColor, type BadgeDefinition } from '../../shared/badges';

const props = defineProps<{
  badge: BadgeDefinition & { earned: boolean; earnedAt?: Date | null };
  showLocked?: boolean;
}>();

const tierColor = computed(() => getTierColor(props.badge.tier));
const tierBgColor = computed(() => getTierBgColor(props.badge.tier));

const formattedDate = computed(() => {
  if (!props.badge.earnedAt) return '';
  return new Date(props.badge.earnedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
});
</script>

<template>
  <div 
    class="badge-card relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-300"
    :class="[
      badge.earned 
        ? `${tierBgColor} hover:scale-105` 
        : 'bg-white/5 border-white/10 opacity-50 grayscale'
    ]"
  >
    <!-- Badge Icon -->
    <div 
      class="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
      :class="badge.earned ? 'animate-bounce-subtle' : ''"
    >
      {{ badge.icon }}
    </div>
    
    <!-- Badge Name -->
    <div class="text-center">
      <div class="text-sm font-semibold text-white">{{ badge.name }}</div>
      <div class="mt-0.5 text-xs capitalize" :class="tierColor">{{ badge.tier }}</div>
    </div>
    
    <!-- Description (on hover) -->
    <div class="absolute inset-0 flex items-center justify-center rounded-xl bg-black/90 p-3 opacity-0 transition-opacity hover:opacity-100">
      <div class="text-center">
        <div class="text-lg">{{ badge.icon }}</div>
        <div class="mt-1 text-sm font-medium text-white">{{ badge.name }}</div>
        <div class="mt-1 text-xs text-white/70">{{ badge.description }}</div>
        <div v-if="badge.earned && formattedDate" class="mt-2 text-[10px] text-green-400">
          Earned {{ formattedDate }}
        </div>
        <div v-else-if="!badge.earned" class="mt-2 text-[10px] text-white/40">
          🔒 Locked
        </div>
      </div>
    </div>
    
    <!-- Earned checkmark -->
    <div 
      v-if="badge.earned" 
      class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white shadow-lg"
    >
      ✓
    </div>
  </div>
</template>

<style scoped>
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}
</style>

