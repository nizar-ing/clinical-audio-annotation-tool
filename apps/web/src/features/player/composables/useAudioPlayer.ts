import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useLocalStoragePref } from '../../../shared/composables/useLocalStoragePref.js';

export function useAudioPlayer(audioEl: Ref<HTMLAudioElement | null>) {
  const currentTime = ref(0);
  const duration = ref(0);
  const playing = ref(false);
  const speed = useLocalStoragePref<number>('playbackSpeed', 1.0);

  function onTimeUpdate() {
    if (audioEl.value) currentTime.value = audioEl.value.currentTime;
  }

  function onLoadedMetadata() {
    if (audioEl.value) {
      // Duration is read from the server-stored file, not trusted from the API response
      duration.value = audioEl.value.duration;
      audioEl.value.playbackRate = speed.value;
    }
  }

  function onEnded() {
    playing.value = false;
  }

  function bindEvents() {
    const el = audioEl.value;
    if (!el) return;
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('ended', onEnded);
    el.playbackRate = speed.value;
  }

  function unbindEvents() {
    const el = audioEl.value;
    if (!el) return;
    el.removeEventListener('timeupdate', onTimeUpdate);
    el.removeEventListener('loadedmetadata', onLoadedMetadata);
    el.removeEventListener('ended', onEnded);
  }

  watch(audioEl, (el, prevEl) => {
    if (prevEl) unbindEvents();
    if (el) bindEvents();
  }, { immediate: true });

  watch(speed, (rate) => {
    if (audioEl.value) audioEl.value.playbackRate = rate;
  });

  function play() {
    void audioEl.value?.play();
    playing.value = true;
  }

  function pause() {
    audioEl.value?.pause();
    playing.value = false;
  }

  function toggle() {
    if (playing.value) { pause(); } else { play(); }
  }

  function seek(seconds: number) {
    if (!audioEl.value) return;
    audioEl.value.currentTime = Math.max(0, Math.min(seconds, duration.value));
  }

  function skip(delta: number) {
    seek(currentTime.value + delta);
  }

  function setSpeed(rate: number) {
    speed.value = rate;
  }

  return { currentTime, duration, playing, speed, play, pause, toggle, seek, skip, setSpeed };
}
