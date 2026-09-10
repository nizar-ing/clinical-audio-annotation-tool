<script setup lang="ts">
import { ref, computed } from 'vue';
import { SkipBack, SkipForward, Play, Pause, Keyboard } from 'lucide-vue-next';
import { useAudioPlayer } from '../composables/useAudioPlayer.js';
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts.js';
import ShortcutsOverlay from './ShortcutsOverlay.vue';

const props = defineProps<{
  audioUrl: string;
  onSaveNow?: () => void;
  onCompleteAndNext?: () => void;
}>();

const audioEl = ref<HTMLAudioElement | null>(null);
const overlayVisible = ref(false);
const shortcutsEnabled = ref(true);

const SPEED_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const { currentTime, duration, playing, speed, toggle, skip, setSpeed, seek } = useAudioPlayer(audioEl);

// Word-click seek from the transcript editor calls this method through a template ref.
// Keeping the audio element ownership inside AudioPlayer avoids provide/inject ceremony.
defineExpose({ seek });

useKeyboardShortcuts({
  enabled: shortcutsEnabled,
  onTogglePlay: toggle,
  onSkipBack: () => skip(-5),
  onSkipForward: () => skip(5),
  onSpeedDown: () => {
    const idx = SPEED_STEPS.indexOf(speed.value);
    if (idx > 0) setSpeed(SPEED_STEPS[idx - 1]!);
  },
  onSpeedUp: () => {
    const idx = SPEED_STEPS.indexOf(speed.value);
    if (idx < SPEED_STEPS.length - 1) setSpeed(SPEED_STEPS[idx + 1]!);
  },
  onToggleOverlay: () => { overlayVisible.value = !overlayVisible.value; },
  onSaveNow: () => props.onSaveNow?.(),
  onCompleteAndNext: () => props.onCompleteAndNext?.(),
});

const progress = computed(() => (duration.value > 0 ? currentTime.value / duration.value : 0));

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function onSeekInput(event: Event) {
  const ratio = Number((event.target as HTMLInputElement).value) / 1000;
  if (audioEl.value) audioEl.value.currentTime = ratio * duration.value;
}
</script>

<template>
  <div class="bg-gradient-to-b from-clin-50 to-white border border-clin-100 rounded-xl p-5 shadow-sm">
    <audio
      ref="audioEl"
      :src="audioUrl"
      preload="metadata"
    />

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <button
        class="flex items-center gap-1.5 font-sans text-sm border border-warm-200 bg-white hover:bg-warm-100 text-warm-700 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
        title="Skip back 5 s (←)"
        @click="skip(-5)"
      >
        <SkipBack
          :size="13"
          :stroke-width="1.75"
        />
        <span class="font-mono">5s</span>
      </button>

      <button
        class="flex items-center justify-center min-w-12 border border-sage-400 bg-white hover:bg-sage-50 text-sage-600 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
        :title="playing ? 'Pause (Space)' : 'Play (Space)'"
        @click="toggle"
      >
        <Pause
          v-if="playing"
          :size="16"
          :stroke-width="1.75"
        />
        <Play
          v-else
          :size="16"
          :stroke-width="1.75"
        />
      </button>

      <button
        class="flex items-center gap-1.5 font-sans text-sm border border-warm-200 bg-white hover:bg-warm-100 text-warm-700 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
        title="Skip forward 5 s (→)"
        @click="skip(5)"
      >
        <span class="font-mono">5s</span>
        <SkipForward
          :size="13"
          :stroke-width="1.75"
        />
      </button>

      <select
        :value="speed"
        class="font-mono text-sm border border-warm-200 bg-white text-warm-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-clin-300 focus:border-clin-400 outline-none cursor-pointer"
        title="Playback speed (, / .)"
        @change="setSpeed(Number(($event.target as HTMLSelectElement).value))"
      >
        <option
          v-for="s in SPEED_STEPS"
          :key="s"
          :value="s"
        >
          {{ s }}×
        </option>
      </select>

      <button
        class="ml-auto flex items-center text-warm-400 hover:text-clin-500 bg-transparent border-0 cursor-pointer transition-colors"
        title="Keyboard shortcuts (?)"
        @click="overlayVisible = !overlayVisible"
      >
        <Keyboard
          :size="15"
          :stroke-width="1.5"
        />
      </button>
    </div>

    <div class="flex items-center gap-3">
      <span class="font-mono text-xs text-warm-500 min-w-10 text-center">{{ formatTime(currentTime) }}</span>
      <input
        type="range"
        min="0"
        max="1000"
        :value="Math.round(progress * 1000)"
        class="flex-1 cursor-pointer accent-clin-500"
        @input="onSeekInput"
      >
      <span class="font-mono text-xs text-warm-500 min-w-10 text-center">{{ formatTime(duration) }}</span>
    </div>
  </div>

  <ShortcutsOverlay
    :visible="overlayVisible"
    @close="overlayVisible = false"
  />
</template>
