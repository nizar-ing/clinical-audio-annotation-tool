<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAudioPlayer } from '../composables/useAudioPlayer.js';
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts.js';
import ShortcutsOverlay from './ShortcutsOverlay.vue';

defineProps<{ audioUrl: string }>();

const audioEl = ref<HTMLAudioElement | null>(null);
const overlayVisible = ref(false);
const shortcutsEnabled = ref(true);

const SPEED_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const { currentTime, duration, playing, speed, toggle, skip, setSpeed } = useAudioPlayer(audioEl);

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
  <div class="audio-player">
    <!-- Hidden native audio element; src comes from prop -->
    <audio
      ref="audioEl"
      :src="audioUrl"
      preload="metadata"
    />

    <div class="audio-player__controls">
      <button
        class="audio-player__btn"
        title="Skip back 5 s (←)"
        @click="skip(-5)"
      >
        ◀ 5s
      </button>

      <button
        class="audio-player__btn audio-player__btn--primary"
        :title="playing ? 'Pause (Space)' : 'Play (Space)'"
        @click="toggle"
      >
        {{ playing ? '❚❚' : '▶' }}
      </button>

      <button
        class="audio-player__btn"
        title="Skip forward 5 s (→)"
        @click="skip(5)"
      >
        5s ▶
      </button>

      <select
        :value="speed"
        class="audio-player__speed"
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
        class="audio-player__btn audio-player__btn--ghost"
        title="Keyboard shortcuts (?)"
        @click="overlayVisible = !overlayVisible"
      >
        ?
      </button>
    </div>

    <div class="audio-player__seek">
      <span class="audio-player__time">{{ formatTime(currentTime) }}</span>
      <input
        type="range"
        min="0"
        max="1000"
        :value="Math.round(progress * 1000)"
        class="audio-player__range"
        @input="onSeekInput"
      >
      <span class="audio-player__time">{{ formatTime(duration) }}</span>
    </div>
  </div>

  <ShortcutsOverlay
    :visible="overlayVisible"
    @close="overlayVisible = false"
  />
</template>

<style scoped>
.audio-player {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}
.audio-player__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.audio-player__btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.1s;
}
.audio-player__btn:hover {
  background: #f3f4f6;
}
.audio-player__btn--primary {
  min-width: 48px;
  font-size: 1rem;
  border-color: #6366f1;
  color: #6366f1;
}
.audio-player__btn--ghost {
  border-color: transparent;
  color: #9ca3af;
  margin-left: auto;
}
.audio-player__speed {
  font-size: 0.875rem;
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
}
.audio-player__seek {
  display: flex;
  align-items: center;
  gap: 8px;
}
.audio-player__time {
  font-family: monospace;
  font-size: 0.8rem;
  color: #6b7280;
  min-width: 40px;
  text-align: center;
}
.audio-player__range {
  flex: 1;
  cursor: pointer;
  accent-color: #6366f1;
}
</style>
