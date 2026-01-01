<script setup lang="ts">
import { format } from 'date-fns';
const config = useRuntimeConfig();
const currentYear = format(new Date(), 'yyyy');
</script>

<template>
  <div class="mt-2 flex items-center justify-center gap-1 text-xs text-neutral-400">
    <!-- Footer content removed -->
  </div>
</template>
