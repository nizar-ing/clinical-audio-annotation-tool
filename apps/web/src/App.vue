<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { Mic, ListChecks, FolderInput } from 'lucide-vue-next';
import ExportButton from './features/export/components/ExportButton.vue';
</script>

<template>
  <div class="min-h-screen">
    <nav class="nav-shiny flex items-center gap-3 sm:gap-6 px-4 sm:px-6 py-3 sm:py-4">
      <span class="flex items-center gap-2 font-display font-semibold text-sage-800 text-sm sm:text-lg tracking-tight shrink-0">
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
    <div class="fixed bottom-5 left-5 z-40 pointer-events-none select-none author-badge">
      <div class="flex items-stretch gap-0 rounded-xl overflow-hidden backdrop-blur-md"
           style="background: rgba(9,28,51,0.62); box-shadow: 0 2px 18px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08);">
        <div class="w-1 shrink-0" style="background: linear-gradient(180deg, #14b2c4 0%, #3d8a7e 100%);"></div>
        <div class="px-4 py-3">
          <p class="font-display font-semibold text-lg text-white/92 m-0 leading-tight tracking-tight"
             style="background: linear-gradient(90deg, #ffffff 0%, #14b2c4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
            Nizar ILAHI
          </p>
          <p class="font-sans text-white/55 m-0 mt-1 leading-tight"
             style="font-size: 0.72rem; letter-spacing: 0.07em; text-transform: uppercase;">
            IKIM &middot; Senior Full Stack Engineer Candidate
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
