<script setup lang="ts">
const props = defineProps<{ habit: Habit; habitDays?: number }>();

// Use compact view (current month) for small displays, full year for modal
const weeks = computed(() => {
  if (props.habitDays && props.habitDays <= 49) {
    // Compact view: show current month
    return generateCurrentMonthWeeks();
  }
  // Full year view for modal
  return generateYearWeeks();
});

// Create a reactive set of completed days for faster lookup
const completedDaysSet = computed(() => new Set(props.habit.completeDays));

const getJournalEntry = (date: string) => {
  if (!date) return null;
  return props.habit.journals?.find(j => j.date === date)?.note;
};

const isCompleted = (date: string) => {
  return completedDaysSet.value.has(date);
};

const getDayClass = (day: DayInfo) => {
  if (!day.date) return 'day empty';

  // Check completion first - completed days should always be green
  if (isCompleted(day.date)) return 'day active';

  // Today but not completed shows as today style
  if (day.isToday) return 'day today';

  // Future days
  if (day.isFuture) return 'day future';

  // Past days that weren't completed
  if (day.isPast) return 'day missed';

  return 'day';
};

const getChipClass = (day: DayInfo) => {
  if (!day.date) return 'chip';

  if (isCompleted(day.date)) return 'chip active';
  if (day.isFuture) return 'chip future';
  if (day.isPast) return 'chip missed';

  return 'chip';
};
</script>

<template>
  <div class="heatmap-container">
    <div class="flex gap-0.5">
      <div v-for="(week, weekIndex) in weeks" :key="weekIndex" class="flex flex-col gap-0.5">
        <div v-for="(day, dayIndex) in week" :key="dayIndex">
          <UTooltip v-if="day.date" :popper="{ placement: 'top' }" :ui="{ wrapper: '', background: '', ring: '', shadow: '', base: '' }">
            <div :class="getDayClass(day)"></div>
            <template #text>
              <div :class="getChipClass(day)">{{ formatDate(day.date) }}</div>
              <div v-if="isCompleted(day.date)" class="mt-1 text-[10px] text-green-400">Completed</div>
              <div v-else-if="day.isToday" class="mt-1 text-[10px] text-blue-400">Today</div>
              <div v-else-if="day.isFuture" class="mt-1 text-[10px] text-neutral-500">Upcoming</div>
              <div v-else-if="day.isPast" class="mt-1 text-[10px] text-red-400/70">Missed</div>
              <div v-if="getJournalEntry(day.date)" class="mt-2 max-w-[200px] text-wrap text-center text-xs text-neutral-400 italic">"{{ getJournalEntry(day.date) }}"</div>
            </template>
          </UTooltip>
          <div v-else class="day empty"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.heatmap-container {
  @apply flex h-full overflow-x-auto rounded-xl;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
}

.day {
  @apply flex h-2.5 w-2.5 rounded-sm bg-white/5;

  &.active {
    @apply bg-gradient-to-tr from-green-300 via-green-400 to-green-500 shadow-sm dark:from-green-400 dark:via-green-500 dark:to-green-800 dark:shadow-green-800;
  }

  &.today {
    @apply bg-blue-500/50 ring-1 ring-blue-400;
  }

  &.future {
    @apply bg-white/10 dark:bg-white/5;
  }

  &.missed {
    @apply bg-red-900/20 dark:bg-red-900/30;
  }

  &.empty {
    @apply bg-transparent;
  }
}

.chip {
  font-size: 0.75rem;
  box-shadow:
    inset 0.5px 0.5px 1px 0px rgba(255, 255, 255, 0.1),
    inset -0.5px -0.5px 1px 0px rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.2) 0px 3px 10px -5px;
  @apply flex select-none items-center justify-center rounded-full bg-black/40 px-2.5 py-0.5 text-white dark:bg-black/80;

  &.active {
    @apply bg-green-950/80 text-green-400;
  }

  &.future {
    @apply bg-neutral-800/80 text-neutral-300;
  }

  &.missed {
    @apply bg-red-950/80 text-red-400;
  }
}
</style>
