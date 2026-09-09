<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { Mic } from 'lucide-vue-next';
import ExportButton from './features/export/components/ExportButton.vue';
</script>

<template>
  <div class="min-h-screen">
    <nav class="nav-shiny flex items-center gap-6 px-6 py-4">
      <span class="flex items-center gap-2 font-display font-semibold text-sage-800 text-lg tracking-tight">
        <Mic
          :size="19"
          :stroke-width="1.5"
          class="text-sage-600 shrink-0"
        />
        ClinAnnotate
      </span>
      <RouterLink
        to="/queue"
        class="text-base font-medium text-sage-700 no-underline transition-colors border-b-2 border-transparent pb-0.5 hover:text-sage-900 hover:border-sage-500 [&.router-link-active]:text-sage-900 [&.router-link-active]:border-sage-600"
      >
        Queue
      </RouterLink>
      <div class="ml-auto">
        <ExportButton />
      </div>
    </nav>
    <RouterView />
  </div>
</template>
