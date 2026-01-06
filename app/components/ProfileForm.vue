<script setup lang="ts">
import { z } from 'zod';

const props = defineProps<{ user: User }>();
const emit = defineEmits<{ (e: 'profileUpdated'): void }>();

const schema = z.object({ userView: z.boolean() });
type Schema = z.infer<typeof schema>;

const formState = reactive<Schema>({
  userView: !!props.user.userView,
});

const queryCache = useQueryCache();

const { mutate: editProfile } = useMutation({
  mutation: (data: Schema) =>
    $fetch('/api/users', {
      method: 'PATCH',
      body: data,
    }) as Promise<User>,

  async onSuccess() {
    await queryCache.invalidateQueries({ key: ['user'], exact: false });
    emit('profileUpdated');
  },

  onSettled() {
    formState.userView = !!props.user.userView;
  },
});

const updateProfile = () => {
  editProfile({ userView: formState.userView });
};

const accountVisibilityMessage = computed(() => {
  return formState.userView
    ? 'Your profile is <strong>public</strong>. Habits set to public can be viewed by anyone, even without logging in.'
    : 'Your profile is <strong>private</strong>. Only you can view your habits.';
});

const { clear } = useUserSession();
const confirmDeleteAccount = ref(false);
const confirmationText = ref('');

const closeDeleteConfirmation = () => {
  confirmationText.value = '';
  confirmDeleteAccount.value = false;
};

const { mutate: deleteAccount } = useMutation({
  mutation: () => $fetch(`/api/users`, { method: 'DELETE' }),

  async onSuccess() {
    await clear();
    await navigateTo('/');
    await queryCache.invalidateQueries({ key: ['user'], exact: false });
  },
});
</script>

<template>
  <div class="p-4 sm:p-8">
    <UForm :schema="schema" :state="formState" class="flex flex-col gap-3 sm:gap-4">
      <ContentBox class="flex items-center justify-between gap-4 sm:gap-14 bg-white/10 p-3 sm:p-4 backdrop-blur-2xl dark:bg-neutral-200/5">
        <div class="flex flex-col gap-1 flex-1 min-w-0">
          <div class="text-sm font-semibold text-white">Public Account</div>
          <div class="text-xs text-white/60" v-html="accountVisibilityMessage"></div>
        </div>
        <UFormGroup name="userView" class="shrink-0">
          <UToggle v-model="formState.userView" @update:model-value="updateProfile" />
        </UFormGroup>
      </ContentBox>
      <ContentBox class="flex flex-col gap-3 bg-white/10 p-3 sm:p-4 backdrop-blur-2xl dark:bg-neutral-200/5">
        <div class="flex flex-col gap-2">
          <div class="text-sm font-semibold text-white">Delete account</div>
          <div class="text-xs text-white/60">
            Permanently delete your account, including all associated data such as habits and progress. This action cannot be undone.
          </div>
        </div>
        <div class="flex items-center">
          <button @click="confirmDeleteAccount = true" class="button bg-red-600 px-3 sm:px-3.5 py-1.5 text-sm font-semibold text-red-100 hover:bg-red-700">Delete my account</button>
        </div>
      </ContentBox>
    </UForm>
  </div>
  <UModal
    v-model="confirmDeleteAccount"
    :ui="{ container: 'items-center px-4 sm:px-0', width: 'w-full max-w-xs sm:w-80', background: '', shadow: '', overlay: { base: 'backdrop-blur-2xl', background: 'bg-white/5 dark:bg-black/60' } }">
    <ContentBox class="flex flex-col gap-4 sm:gap-5 bg-white/10 p-4 sm:p-6 backdrop-blur-2xl dark:bg-neutral-200/5">
      <div class="text-center text-lg sm:text-xl font-semibold">Delete Account</div>
      <p class="px-4 sm:px-6 text-center text-sm text-red-500">WARNING: This is permanent!</p>
      <p class="text-xs text-neutral-400">
        All your data including habits and progress will be permanently deleted. This action cannot be undone.
      </p>
      <p class="text-xs text-neutral-400">
        Type <strong>DELETE</strong> to confirm.
      </p>
      <UInput color="red" v-model="confirmationText" placeholder="Type DELETE here..." />
      <div class="flex items-center gap-3 sm:gap-4">
        <UButton color="gray" class="flex-1 justify-center" size="sm" @click="closeDeleteConfirmation">Close</UButton>
        <UButton color="red" size="sm" :disabled="confirmationText.toLowerCase() !== 'delete'" @click="deleteAccount()">Delete</UButton>
      </div>
    </ContentBox>
  </UModal>
</template>
