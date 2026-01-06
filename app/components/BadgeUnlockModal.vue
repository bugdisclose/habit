<script setup lang="ts">
import type { BadgeDefinition } from '../../shared/badges';

const props = defineProps<{
  badge: BadgeDefinition;
}>();

const emit = defineEmits<{
  close: [];
}>();

const show = ref(true);

// Auto-close after 3 seconds
onMounted(() => {
  setTimeout(() => {
    show.value = false;
    setTimeout(() => emit('close'), 300);
  }, 3000);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="show"
        class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] flex items-center gap-3 rounded-xl bg-neutral-800/95 backdrop-blur-sm px-4 py-3 shadow-lg border border-white/10"
        @click="show = false"
      >
        <span class="text-2xl">{{ badge.icon }}</span>
        <div class="flex-1 min-w-0">
          <div class="text-[10px] uppercase tracking-wider text-white/40">New Badge</div>
          <div class="text-sm font-medium text-white truncate">{{ badge.name }}</div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(100%); }
.toast-leave-to { opacity: 0; transform: translateY(20px); }
</style>

