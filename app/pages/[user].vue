<script setup lang="ts">
const { session } = useUserSession();
const login = useRoute().params.user as string;
const isMyProfile = computed(() => session.value?.user?.login === login);

const fetchUser = () => useRequestFetch()(`/api/users/${login}`) as Promise<User>;
const fetchHabits = () => useRequestFetch()(`/api/users/${login}/habits`) as Promise<Habit[]>;
const fetchMyHabits = () => useRequestFetch()('/api/habits') as Promise<Habit[]>;

const { data: user } = useQuery({ key: ['user', login], query: fetchUser });
const { data: habits } = useQuery({ key: ['habits', login], query: fetchHabits });
const { data: myHabits } = useQuery({
  key: ['my_habits'],
  query: fetchMyHabits,
  enabled: isMyProfile.value,
});

const { data: sharedData } = useFetch('/api/habits/shared', {
  lazy: true,
  enabled: isMyProfile
});

const observedHabits = computed(() => sharedData.value?.sharedWithMe.filter(s => s.share.mode === 'observer') || []);
const buddyMap = computed(() => {
  const map = new Map();
  if (!sharedData.value) return map;
  
  // Habits I shared with others (I am owner)
  sharedData.value.sharedByMe.forEach(item => {
    if (item.share.mode === 'buddy' && item.buddyHabit) {
       map.set(item.share.habitId, { 
         name: item.recipient.name || item.recipient.login,
         completeDays: item.buddyHabit.completeDays
       });
    }
  });
  
  // Habits shared with me (I am recipient, but I have my own copy)
  // Wait, sharedWithMe contains the ORIGINAL habit. My copy is in 'myHabits'.
  // We need to link them.
  // The 'habit_shares' table has 'buddyHabitId' which is MY habit ID.
  sharedData.value.sharedWithMe.forEach(item => {
    if (item.share.mode === 'buddy' && item.share.buddyHabitId) {
       map.set(item.share.buddyHabitId, {
         name: item.user.name || item.user.login,
         completeDays: item.habit.completeDays // The original habit's completion
       });
    }
  });
  return map;
});

const emptyHabits = computed(() => habits.value?.length === 0);
const emptyMyHabits = computed(() => myHabits.value?.length === 0);
const pageTitle = computed(() => (user.value?.login && user.value?.name ? `${user.value.name} (@${user.value.login}) · Habits and Todos` : 'Page Not Found · Habit'));

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
  ogSiteName: pageTitle,
});
</script>

<template>
  <Card v-if="user">
    <div class="relative z-10">
      <ProfileHeader :user="user" />
      <template v-if="!user.userView && !isMyProfile"><PrivateAccount :user="user" /></template>
      <template v-else>
        <div class="scrollable-card max-h-[calc(100vh-18.875rem)] overflow-y-auto">
          <HabitCard
            v-for="habit in isMyProfile ? myHabits : habits"
            :key="habit.id"
            :habit="habit"
            :isMyProfile="isMyProfile"
            :buddyInfo="buddyMap.get(habit.id)"
          />

          <!-- Observer Section -->
          <div v-if="observedHabits.length > 0" class="mt-6 sm:mt-8 px-3 sm:px-4">
             <h3 class="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-white/50">Observing</h3>
             <div v-for="item in observedHabits" :key="item.share.id" class="mb-3 sm:mb-4">
                <div class="mb-1 text-xs text-white/40">
                   From {{ item.user.name || item.user.login }}
                </div>
                <HabitCard
                  :habit="item.habit"
                  :isMyProfile="false"
                  :isObserver="true"
                  :permissions="item.share.permissions"
                />
             </div>
          </div>
        </div>
        <EmptyHabits v-if="isMyProfile ? (emptyMyHabits && observedHabits.length === 0) : emptyHabits" :isMyProfile="isMyProfile" />
      </template>
    </div>
  </Card>
  <Card v-else class="items-start justify-center gap-5 sm:gap-7 p-4 sm:p-6">
    <div class="relative z-10 flex w-full sm:w-5/6 flex-col gap-4 sm:gap-5">
      <div class="text-2xl sm:text-3xl font-semibold">404</div>
      <p class="font-semibold">Sorry, this page isn't available.</p>
      <p class="text-sm text-white/50">The link you followed may be broken, or the page may have been removed.</p>
    </div>
    <a href="/" class="button bg-white/20 px-2.5 py-2 hover:bg-white/30 w-full sm:w-auto justify-center">
      <UIcon name="i-heroicons-arrow-left-16-solid" class="h-5 w-5" />
      Go back to Habit
    </a>
  </Card>
</template>
