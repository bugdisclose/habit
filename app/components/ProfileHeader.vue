<script setup lang="ts">
const { loggedIn, session } = useUserSession();
const createHabitModal = ref(false);
const props = defineProps<{ user: User }>();
const isOwnProfile = computed(() => session.value.user?.login === useRoute().params.user);
const login = computed(() => props.user?.login || '');
</script>

<template>
  <div class="relative flex flex-col sm:flex-row p-4 sm:p-5 gap-4">
    <!-- Profile Info -->
    <div class="flex gap-4 sm:flex-col sm:gap-3">
      <UAvatar size="2xl" class="sm:size-3xl" :src="user?.avatarUrl" :alt="user?.login" />
      <div class="flex flex-col gap-1 flex-1 min-w-0">
        <div class="text-lg sm:text-xl font-medium truncate">{{ user?.name }}</div>
        <div class="text-xs text-white/40 line-clamp-2">{{ user?.bio }}</div>
        <!-- Subtle badges row -->
        <BadgesSection v-if="login" :login="login" :isMyProfile="isOwnProfile" />
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="isOwnProfile" class="absolute right-4 top-4 sm:right-5 sm:top-5 flex gap-2 sm:gap-3">
      <button class="button bg-white/20 py-1.5 px-2 sm:pl-2 sm:pr-2.5 hover:bg-white/25" @click="createHabitModal = true">
        <UIcon name="i-heroicons-plus-16-solid" class="h-5 w-5" />
        <span class="hidden sm:inline">Create</span>
      </button>
      <NotificationDropdown />
      <Dropdown :user="user" />
    </div>
    <div v-else-if="!loggedIn" class="absolute right-4 top-4 sm:right-5 sm:top-5 flex gap-2">
      <a href="/api/auth/github" class="button bg-white/20 px-2 py-1.5 hover:bg-white/25">
        <UIcon name="i-simple-icons-github" class="h-5 w-5" />
        <span class="hidden sm:inline">Sign in</span>
      </a>
    </div>

    <UModal
      v-model="createHabitModal"
      :ui="{ container: 'items-center', width: 'w-full max-w-sm sm:max-w-md', background: '', shadow: '', overlay: { base: 'backdrop-blur-2xl', background: 'bg-white/5 dark:bg-black/60' } }">
      <HabitForm @habitAdded="createHabitModal = false" />
    </UModal>
  </div>
</template>
