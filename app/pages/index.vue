<script setup lang="ts">
const { user } = useUserSession();

watchEffect(async () => {
  if (user.value) {
    await navigateTo(user.value.login);
  }
});
</script>

<template>
  <Card class="items-start justify-center gap-5 sm:gap-7 p-4 sm:p-6">
    <div class="relative z-10 flex w-full sm:w-5/6 flex-col gap-4 sm:gap-5">
      <div class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border-4 border-green-600 bg-green-400 shadow-lg"></div>
      <div class="text-base sm:text-lg font-medium">Habit Tracker</div>
      <div class="text-2xl sm:text-3xl font-medium leading-snug">
        An efficient tool to
        <span class="text-green-400">track</span>
        and manage your
        <span class="text-green-400">daily habits</span>
      </div>
    </div>
    <a href="/api/auth/github" class="button bg-white/20 px-2.5 py-2 hover:bg-white/30 w-full sm:w-auto justify-center">
      <UIcon name="i-simple-icons-github" class="h-5 w-5" />
      Continue with GitHub
    </a>
    <a href="/api/auth/google" class="button bg-white/20 px-2.5 py-2 hover:bg-white/30 w-full sm:w-auto justify-center">
      <UIcon name="i-simple-icons-google" class="h-5 w-5" />
      Continue with Google
    </a>
  </Card>
</template>
