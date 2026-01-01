<script setup lang="ts">
import { marked } from 'marked';
import { isSameDay, parseISO, format } from 'date-fns';
const queryCache = useQueryCache();

const props = defineProps<{ 
  habit: Habit; 
  isMyProfile: Boolean;
  buddyInfo?: { name: string; completeDays: string[] };
  isObserver?: boolean;
  permissions?: { streak: boolean; status: boolean; journal: boolean };
}>();

const renderMarkdown = (text: string) => marked(text);

const getCompletionRate = (habit: Habit) => Math.round((habit.completeDays.length / 40) * 100);

const openHabitModal = ref(false);
const openShareModal = ref(false);

const { mutate: sendReaction } = useMutation({
  mutation: (emoji: string) => $fetch(`/api/habits/${props.habit.id}/react`, { method: 'POST', body: { reaction: emoji } }),
  onSuccess() { useToast().add({ title: 'Reaction sent!', color: 'green' }); },
  onError(err) { useToast().add({ title: 'Error', description: err.message, color: 'red' }); }
});

const reactions = ['🔥', '👍', '💪', '🎉'];

// Streaks
const currentStreak = computed(() => calculateStreak(props.habit.completeDays));

const sharedStreak = computed(() => {
   if (!props.buddyInfo) return 0;
   return calculateSharedStreak(props.habit.completeDays, props.buddyInfo.completeDays);
});

// Helper for Buddy Status
const isBuddyCompleted = computed(() => {
  if (!props.buddyInfo) return false;
  return props.buddyInfo.completeDays.some(day => isSameDay(parseISO(day), new Date()));
});

// Delete habit
const confirmDeleteHabit = ref(false);
const confirmationText = ref('');

const openDeleteConfirmation = (habit: Habit) => {
  confirmDeleteHabit.value = true;
};

const closeDeleteConfirmation = () => {
  confirmationText.value = '';
  confirmDeleteHabit.value = false;
};

const { mutate: deleteHabit } = useMutation({
  mutation: (habit: Habit) => $fetch(`/api/habits/${habit.id}`, { method: 'DELETE' }),

  async onSuccess() {
    await queryCache.invalidateQueries({ active: true });
  },
});

// Edit habit
const editingHabit = ref<number | null>(null);
const edit = ref<{ title: string; description: string; habitView: boolean }>({ title: '', description: '', habitView: false });

const editHabit = (habit: Habit) => {
  editingHabit.value = habit.id;
  edit.value = { title: habit.title, description: habit.description || '', habitView: habit.habitView };
};

const { mutate: saveHabit } = useMutation({
  mutation: () =>
    $fetch(`/api/habits/${editingHabit.value}`, {
      method: 'PATCH',
      body: {
        title: edit.value.title,
        description: edit.value.description,
        habitView: edit.value.habitView,
      },
    }),

  async onSuccess() {
    await queryCache.invalidateQueries({ active: true });
    editingHabit.value = null;
  },
});

const cancelEdit = () => {
  editingHabit.value = null;
};

const isTodayCompleted = (habit: Habit) => habit.completeDays.some(day => isSameDay(parseISO(day), new Date()));

const { mutate: toggleTodayCompletion } = useMutation({
  mutation: (habit: Habit) => {
    const isCompletedToday = habit.completeDays.some(day => isSameDay(parseISO(day), new Date()));

    const updatedCompleteDays = isCompletedToday
      ? habit.completeDays.filter(day => !isSameDay(parseISO(day), new Date()))
      : [...habit.completeDays, format(new Date(), 'yyyy-MM-dd')];

    return $fetch(`/api/habits/${habit.id}`, {
      method: 'PATCH',
      body: {
        completeDays: updatedCompleteDays,
      },
    });
  },

  async onSuccess(habit) {
    await queryCache.invalidateQueries({ active: true });
    if (habit.completeDays.some(day => isSameDay(parseISO(day), new Date()))) {
      startConfettiAnimation();
    }
  },
});

// Journal Logic
const openJournalModal = ref(false);
const journalNote = ref('');
const pendingHabit = ref<Habit | null>(null);

const { mutate: saveJournal } = useMutation({
  mutation: ({ id, date, note }: { id: number; date: string; note: string }) =>
    $fetch(`/api/habits/${id}/journal`, {
      method: 'POST',
      body: { date, note },
    }),
  async onSuccess() {
    await queryCache.invalidateQueries({ active: true });
  }
});

const handleToggle = (habit: Habit) => {
  if (isTodayCompleted(habit)) {
    // Unchecking: just toggle off
    toggleTodayCompletion(habit);
  } else {
    // Checking: open modal
    pendingHabit.value = habit;
    journalNote.value = '';
    openJournalModal.value = true;
  }
};

const confirmCompletion = async (withNote: boolean) => {
  if (!pendingHabit.value) return;

  // 1. Toggle completion
  toggleTodayCompletion(pendingHabit.value);

  // 2. Save note if needed
  if (withNote && journalNote.value.trim()) {
    saveJournal({
      id: pendingHabit.value.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: journalNote.value
    });
  }

  openJournalModal.value = false;
  pendingHabit.value = null;
};
</script>

<template>
  <div>
    <ContentBox class="mx-4 mb-4 flex cursor-pointer gap-3 bg-neutral-400/5 p-3 transition hover:bg-white/5 active:scale-[.975]" @click="openHabitModal = true">
    <div class="flex flex-1 flex-col justify-center gap-1">
      <div class="flex items-center justify-between">
        <div class="text-md line-clamp-1 font-medium text-white">{{ habit.title }}</div>
        
        <!-- Individual Streak -->
        <div v-if="currentStreak > 0 && !buddyInfo" class="flex items-center gap-1 text-orange-400" title="Current Streak">
            <UIcon name="i-heroicons-fire-20-solid" class="w-4 h-4 animate-pulse" />
            <span class="text-xs font-bold">{{ currentStreak }}</span>
        </div>
      </div>
      <div v-if="isMyProfile || !permissions || permissions.journal" class="line-clamp-3 text-xs text-white/70" v-html="renderMarkdown(habit.description || '')"></div>
      <div v-else class="flex items-center gap-1.5 py-1 text-xs text-white/40 italic">
        <UIcon name="i-heroicons-lock-closed-16-solid" class="w-3 h-3" />
        Journal is private
      </div>
      
      <!-- Shared Badge -->
      <div v-if="buddyInfo" class="mt-2 inline-flex items-center gap-2 rounded-full bg-white/5 pr-3 pl-1 py-0.5 text-xs font-medium border border-white/5">
         
         <!-- Mutual Streak -->
         <div v-if="sharedStreak > 0" class="flex items-center gap-1 text-orange-400 border-r border-white/10 pr-2 mr-1">
             <UIcon name="i-heroicons-fire-20-solid" class="w-3.5 h-3.5" />
             <span class="font-bold">{{ sharedStreak }}</span>
         </div>
         
         <!-- User Status -->
         <div class="flex items-center gap-1.5">
             <div class="flex items-center justify-center p-0.5 rounded-full" :class="isBuddyCompleted ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'">
                <UIcon name="i-heroicons-users-20-solid" class="w-3 h-3" />
             </div>
             <span :class="isBuddyCompleted ? 'text-green-400' : 'text-white/60'">
                {{ buddyInfo.name }}
             </span>
         </div>
      </div>

       <!-- Observer Reactions -->
      <div v-if="isObserver" class="mt-3 flex gap-2">
         <button 
           v-for="emoji in reactions" 
           :key="emoji"
           @click.stop="sendReaction(emoji)"
           class="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-200 text-lg shadow-sm"
           title="Send Reaction"
         >
           {{ emoji }}
         </button>
      </div>
    </div>
    <HabitHeatmap :habit="habit" :habitDays="49" />
  </ContentBox>
  <UModal
    v-model="openHabitModal"
    :ui="{ container: 'items-center', background: '', shadow: '', overlay: { base: 'backdrop-blur-2xl', background: 'bg-white/5 dark:bg-black/60' } }">
    <div class="flex flex-col gap-4">
      <ContentBox class="flex flex-col gap-2.5 bg-white/10 p-2.5 dark:bg-neutral-400/5">
        <div class="flex w-full items-center justify-between gap-2.5 px-0.5 text-white/25 dark:text-white/15">
          <div class="text-xs">
            Completion Rate:
            <strong>{{ getCompletionRate(habit) }}%</strong>
          </div>
          <UProgress
            :value="getCompletionRate(habit)"
            size="xs"
            :ui="{
              wrapper: 'flex-1',
              progress: {
                color: 'text-white/25 dark:text-white/15',
                track:
                  '[&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-bar]:dark:bg-white/5 [@supports(selector(&::-moz-progress-bar))]:bg-white/10 [@supports(selector(&::-moz-progress-bar))]:dark:bg-white/5',
              },
            }" />
          <div class="text-xs">
            Today:
            <strong>
              {{ isTodayCompleted(habit) ? 'Completed' : 'Pending' }}
            </strong>
          </div>
          <!-- Detailed Buddy Status in Modal -->
          <div v-if="buddyInfo" class="ml-2 pl-2 border-l border-white/10 flex items-center gap-1 text-xs">
             <UIcon name="i-heroicons-user-group-20-solid" class="w-3.5 h-3.5" />
             <span class="text-white/50">{{ buddyInfo.name }}:</span>
             <strong :class="isBuddyCompleted ? 'text-green-400' : 'text-orange-400'">
                {{ isBuddyCompleted ? 'Completed' : 'Waiting' }}
             </strong>
          </div>
        </div>
        <HabitHeatmap :habit="habit" :habitDays="343" />
      </ContentBox>
      <div class="flex flex-col gap-4 px-3 text-white">
        <div class="flex items-center justify-between gap-3">
          <UInput v-if="editingHabit === habit.id" :ui="{ wrapper: 'flex-1', rounded: 'rounded-full', size: { sm: 'text-sm font-semibold' } }" v-model="edit.title" />
          <div v-else class="line-clamp-1 text-xl font-semibold">{{ habit.title }}</div>
          <div v-if="isMyProfile" class="flex items-center gap-3">
            <button
              @click="handleToggle(habit)"
              class="button px-2.5 py-1.5 font-semibold outline-none"
              :class="isTodayCompleted(habit) ? 'bg-white/10 hover:bg-white/25' : 'bg-green-500 hover:bg-green-400 dark:bg-green-400 dark:text-green-950 dark:hover:bg-green-300'">
              <UIcon v-if="!isTodayCompleted(habit)" name="i-heroicons-check-16-solid" class="h-5 w-5" />
              {{ isTodayCompleted(habit) ? 'Undo' : 'Complete' }}
            </button>

            <UPopover :popper="{ placement: 'bottom-end' }" :ui="{ background: '', shadow: '', ring: '' }">
              <button class="button bg-white/10 p-1.5 hover:bg-white/25">
                <UIcon name="i-heroicons-ellipsis-horizontal-20-solid" class="h-5 w-5" />
              </button>
              <template #panel="{ close }">
                <div class="dropdown">
                  <div
                    @click="
                      () => {
                        close();
                        openShareModal = true;
                      }
                    "
                    class="m-1 flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-black/30">
                    <UIcon name="i-heroicons-share-20-solid" class="h-5 w-5" />
                    <span>Share</span>
                  </div>
                  <div class="border-b border-white/5"></div>
                  <div
                    @click="
                      () => {
                        close();
                        editHabit(habit);
                      }
                    "
                    class="m-1 flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-black/30">
                    <UIcon name="i-heroicons-pencil-square-20-solid" class="h-5 w-5" />
                    <span>Edit</span>
                  </div>
                  <div class="border-b border-white/5"></div>
                  <div
                    @click="
                      () => {
                        close();
                        openDeleteConfirmation(habit);
                      }
                    "
                    class="m-1 flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-black/30 dark:text-red-500 dark:hover:bg-red-900/30">
                    <UIcon name="i-heroicons-trash-20-solid" class="h-5 w-5" />
                    <span>Delete</span>
                  </div>
                </div>
              </template>
            </UPopover>
          </div>
        </div>
        <ShareHabitModal v-if="openShareModal" :habit="habit" @close="openShareModal = false" />
        <ContentBox class="flex flex-col gap-2 bg-white/10 p-4 backdrop-blur-2xl dark:bg-neutral-200/5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-medium text-white/50">
              <p>{{ format(habit.createdAt, 'MMM d, yyyy') }}</p>
              <UIcon v-if="isMyProfile" :name="habit.habitView ? 'i-heroicons-eye-20-solid' : 'i-heroicons-eye-slash-20-solid'" class="-mt-0.5 h-4 w-4" />
            </div>
          </div>
           <div class="max-h-[calc(100vh-23rem)] overflow-y-auto">
             <UTextarea v-if="editingHabit === habit.id" v-model="edit.description" autoresize />
             <div v-else-if="isMyProfile || !permissions || permissions.journal" class="prose prose-sm prose-invert" v-html="renderMarkdown(habit.description || '')"></div>
             <div v-else class="text-sm text-white/30 italic py-4 text-center">Journal entries are private.</div>
           </div>
          <div v-if="editingHabit === habit.id" class="mt-2 flex items-center justify-between">
            <div></div>
            <div class="flex items-center gap-4 text-sm">
              <div>
                Visibility:
                <strong>{{ edit.habitView ? 'Public' : 'Private' }}</strong>
              </div>
              <UToggle v-model="edit.habitView" />
            </div>
          </div>
        </ContentBox>
        <div v-if="editingHabit === habit.id" class="flex items-center justify-between">
          <div></div>
          <div class="flex gap-2">
            <UButton :ui="{ rounded: 'rounded-full' }" @click="cancelEdit" color="white" variant="link">Cancel</UButton>
            <UButton :ui="{ rounded: 'rounded-full' }" @click="saveHabit" trailing>Save changes</UButton>
          </div>
        </div>
      </div>
    </div>
    <UModal v-model="confirmDeleteHabit" :ui="{ width: 'w-80', rounded: 'rounded-2xl' }">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">Are you sure?</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="closeDeleteConfirmation" />
          </div>
        </template>
        <div class="flex flex-col gap-4">
          <p v-if="habit.completeDays.length > 1" class="text-sm text-red-500">
            Warning: This habit has been completed for {{ habit.completeDays.length }} days. Deleting it will remove all progress.
          </p>
          <p class="text-sm text-neutral-400">
            To confirm deletion, please type
            <strong>DELETE</strong>
            in the box below.
          </p>
          <UInput color="red" v-model="confirmationText" placeholder="Type DELETE here..." />
          <UButton block color="red" :disabled="confirmationText.toLowerCase() !== 'delete'" @click="deleteHabit(habit)">I understand, delete this habit</UButton>
        </div>
      </UCard>
    </UModal>
  </UModal>

  <UModal v-model="openJournalModal" :ui="{ width: 'w-full max-w-sm', rounded: 'rounded-2xl', background: 'bg-neutral-900', overlay: { background: 'backdrop-blur-sm bg-black/50' } }">
    <div class="p-5 flex flex-col gap-4">
      <div class="flex flex-col gap-1">
         <h3 class="text-lg font-semibold text-white">How did it go? ✍️</h3>
         <p class="text-sm text-white/50">Add a quick note about your progress today.</p>
      </div>
      <UTextarea 
        v-model="journalNote" 
        placeholder="I felt great because..." 
        :rows="3" 
        autoresize 
        :ui="{ color: { gray: { outline: 'bg-white/5 border-white/10 ring-0 focus:ring-1 focus:ring-white/20' } } }"
      />
      <div class="flex gap-3 justify-end pt-2">
         <button @click="confirmCompletion(false)" class="text-sm font-medium text-white/50 hover:text-white transition">Skip</button>
         <button @click="confirmCompletion(true)" class="bg-white text-black px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-neutral-200 transition">Complete</button>
      </div>
    </div>
  </UModal>
  </div>
</template>
