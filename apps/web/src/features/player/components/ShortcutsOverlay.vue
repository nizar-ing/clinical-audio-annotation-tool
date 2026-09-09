<script setup lang="ts">
import { X } from 'lucide-vue-next';
defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const shortcuts = [
  { keys: 'Space',      action: 'Play / Pause' },
  { keys: '← / J',     action: 'Skip back 5 s' },
  { keys: '→ / L',     action: 'Skip forward 5 s' },
  { keys: ', / [',     action: 'Speed −0.25×' },
  { keys: '. / ]',     action: 'Speed +0.25×' },
  { keys: '?',         action: 'Toggle this overlay' },
  { keys: 'T',         action: 'Open span type picker' },
  { keys: 'Ctrl + S',  action: 'Save transcript now' },
  { keys: 'Ctrl + ↵',  action: 'Complete & go to next' },
];
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 bg-warm-900/40 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="emit('close')"
      @keydown.escape="emit('close')"
    >
      <div
        class="bg-white rounded-xl shadow-2xl p-6 min-w-80 max-w-md"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div class="flex justify-between items-center mb-5">
          <h2 class="font-display text-base font-semibold text-warm-900 m-0">
            Keyboard Shortcuts
          </h2>
          <button
            class="flex items-center justify-center text-warm-400 hover:text-warm-700 bg-transparent border-0 cursor-pointer p-1 transition-colors"
            aria-label="Close"
            @click="emit('close')"
          >
            <X
              :size="16"
              :stroke-width="2"
            />
          </button>
        </div>
        <table class="w-full border-collapse font-sans text-sm">
          <thead>
            <tr>
              <th class="text-left px-2 py-2 font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 border-b border-warm-200">
                Key
              </th>
              <th class="text-left px-2 py-2 font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 border-b border-warm-200">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sc in shortcuts"
              :key="sc.keys"
            >
              <td class="px-2 py-2 border-b border-warm-100">
                <kbd class="inline-block font-mono text-xs px-1.5 py-0.5 bg-warm-100 border border-warm-300 rounded text-warm-700">{{ sc.keys }}</kbd>
              </td>
              <td class="px-2 py-2 border-b border-warm-100 text-warm-700">
                {{ sc.action }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Teleport>
</template>
