<script setup lang="ts">
const { loggedIn, session } = useUserSession();
const createHabitModal = ref(false);
const props = defineProps<{ user: User }>();
const isOwnProfile = computed(() => session.value.user?.login === useRoute().params.user);
const login = computed(() => props.user?.login || '');
</script>

<template>
  <div class="relative p-4 sm:p-5">
    <!-- Action Buttons (positioned absolutely) -->
    <div v-if="isOwnProfile" class="absolute right-4 top-4 sm:right-5 sm:top-5 flex gap-2 z-10">
      <button class="button bg-white/20 py-1.5 px-2 hover:bg-white/25" @click="createHabitModal = true">
        <UIcon name="i-heroicons-plus-16-solid" class="h-5 w-5" />
      </button>
      <NotificationDropdown />
      <Dropdown :user="user" />
    </div>
    <div v-else-if="!loggedIn" class="absolute right-4 top-4 sm:right-5 sm:top-5 flex gap-2 z-10">
      <a href="/api/auth/github" class="button bg-white/20 px-2 py-1.5 hover:bg-white/25">
        <UIcon name="i-simple-icons-github" class="h-5 w-5" />
      </a>
    </div>

    <!-- Profile Info -->
    <div class="flex gap-3 sm:gap-4 pr-24 sm:pr-0">
      <UAvatar size="xl" class="shrink-0" :src="user?.avatarUrl" :alt="user?.login" />
      <div class="flex flex-col gap-0.5 min-w-0">
        <div class="text-base sm:text-lg font-medium truncate">{{ user?.name }}</div>
        <div class="text-xs text-white/40 line-clamp-1 sm:line-clamp-2">{{ user?.bio }}</div>
        <BadgesSection v-if="login" :login="login" :isMyProfile="isOwnProfile" />
      </div>
    </div>

    <UModal
      v-model="createHabitModal"
      :ui="{ container: 'items-center px-4', width: 'w-full max-w-sm', background: '', shadow: '', overlay: { base: 'backdrop-blur-2xl', background: 'bg-white/5 dark:bg-black/60' } }">
      <HabitForm @habitAdded="createHabitModal = false" />
    </UModal>
  </div>
</template>
