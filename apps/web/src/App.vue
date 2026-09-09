<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="min-h-screen">
    <nav class="nav-shiny flex items-center gap-6 px-6 py-4">
      <span class="font-display font-semibold text-sage-800 text-base tracking-tight">
        ClinAnnotate
      </span>
      <RouterLink
        to="/queue"
        class="text-sm font-medium text-sage-700 no-underline transition-colors border-b-2 border-transparent pb-0.5 hover:text-sage-900 hover:border-sage-500 [&.router-link-active]:text-sage-900 [&.router-link-active]:border-sage-600"
      >
        Queue
      </RouterLink>
    </nav>
    <RouterView />
  </div>
</template>
