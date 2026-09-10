<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { Mic, ListChecks, FolderInput } from 'lucide-vue-next';
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
        class="nav-pill"
      >
        <span class="nav-pill-label">Queue</span>
        <span class="nav-pill-icon">
          <ListChecks
            :size="15"
            :stroke-width="2"
          />
        </span>
      </RouterLink>
      <RouterLink
        to="/ingest"
        class="nav-pill"
      >
        <span class="nav-pill-label">Ingest</span>
        <span class="nav-pill-icon">
          <FolderInput
            :size="15"
            :stroke-width="2"
          />
        </span>
      </RouterLink>
      <div class="ml-auto">
        <ExportButton />
      </div>
    </nav>
    <RouterView />
  </div>
</template>
