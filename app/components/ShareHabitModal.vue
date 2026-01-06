<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '#ui/types';

const props = defineProps<{
  habit: Habit;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const schema = z.object({
  targetUsername: z.string().min(1, 'Username is required').toLowerCase(),
  mode: z.enum(['buddy', 'observer']),
  permissions: z.object({
    streak: z.boolean(),
    status: z.boolean(),
    journal: z.boolean(),
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  targetUsername: '',
  mode: 'buddy',
  permissions: {
    streak: true,
    status: true,
    journal: false,
  },
});

const modes = [
  { label: 'Buddy Mode', value: 'buddy', description: 'Commit together. Shared streak.' },
  { label: 'Observer', value: 'observer', description: 'View only. Send reactions.' },
];

const { mutate: shareHabit, isPending } = useMutation({
  mutation: (data: Schema) => {
    return $fetch(`/api/habits/${props.habit.id}/share`, {
      method: 'POST',
      body: data,
    });
  },
  onSuccess() {
    useToast().add({ title: 'Invite sent!', color: 'green' });
    emit('close');
  },
  onError(err) {
    useToast().add({ title: 'Error sending invite', description: err.data?.message || err.message, color: 'red' });
  },
});

function onSubmit(event: FormSubmitEvent<Schema>) {
  shareHabit(event.data);
}
</script>

<template>
  <UModal :model-value="true" @close="emit('close')" :ui="{ container: 'px-4 sm:px-0', width: 'w-full max-w-xs sm:max-w-md' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-sm sm:text-base font-semibold leading-6 text-gray-900 dark:text-white truncate">
            Share "{{ habit.title }}"
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1 shrink-0" @click="emit('close')" />
        </div>
      </template>

      <UForm :schema="schema" :state="state" class="space-y-3 sm:space-y-4" @submit="onSubmit">
        <UFormGroup label="Share with (Username)" name="targetUsername">
          <UInput v-model="state.targetUsername" placeholder="Enter username..." size="sm" />
        </UFormGroup>

        <UFormGroup label="Mode" name="mode" :ui="{ label: { base: 'mb-2 block font-medium text-gray-700 dark:text-gray-200 text-sm' } }">
          <div class="grid grid-cols-2 gap-2 sm:gap-3">
            <div
              v-for="mode in modes"
              :key="mode.value"
              class="cursor-pointer rounded-xl border p-2 sm:p-3 transition-all duration-200 hover:scale-[1.02] hover:bg-white/5 relative overflow-hidden"
              :class="state.mode === mode.value ? 'border-green-500 bg-green-500/10 ring-1 ring-green-500' : 'border-white/10 bg-white/5 hover:border-white/20'"
              @click="state.mode = mode.value as any"
            >
              <div v-if="state.mode === mode.value" class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-green-400">
                  <UIcon name="i-heroicons-check-circle-20-solid" class="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <div class="flex flex-col items-center text-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                 <div class="p-1.5 sm:p-2 rounded-full bg-white/10">
                    <UIcon :name="mode.value === 'buddy' ? 'i-heroicons-users' : 'i-heroicons-eye'" class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                 </div>
                 <div class="font-semibold text-white text-xs sm:text-sm">{{ mode.label }}</div>
                 <div class="text-[10px] sm:text-xs text-white/50 leading-tight">{{ mode.description }}</div>
              </div>
            </div>
          </div>
        </UFormGroup>

        <UFormGroup label="Visibility Permissions" :ui="{ label: { base: 'text-sm' } }">
          <div class="space-y-1.5 sm:space-y-2">
            <UCheckbox v-model="state.permissions.streak" label="Share Streak" :ui="{ label: 'text-sm' }" />
            <UCheckbox v-model="state.permissions.status" label="Share Status" :ui="{ label: 'text-sm' }" />
            <UCheckbox v-model="state.permissions.journal" label="Share Journal" :ui="{ label: 'text-sm' }" />
          </div>
        </UFormGroup>

        <div class="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
          <UButton label="Cancel" color="gray" variant="ghost" size="sm" @click="emit('close')" />
          <UButton type="submit" label="Send Invite" color="green" size="sm" :loading="isPending" />
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>
