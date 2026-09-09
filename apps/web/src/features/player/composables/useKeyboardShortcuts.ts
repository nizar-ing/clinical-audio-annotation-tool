import { onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

interface ShortcutOptions {
  enabled: Ref<boolean>;
  onTogglePlay: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSpeedDown: () => void;
  onSpeedUp: () => void;
  onToggleOverlay: () => void;
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useKeyboardShortcuts(options: ShortcutOptions) {
  function handleKeydown(event: KeyboardEvent) {
    if (!options.enabled.value || isInputFocused()) return;

    switch (event.key) {
      case ' ':
        event.preventDefault();
        options.onTogglePlay();
        break;
      case 'ArrowLeft':
      case 'j':
      case 'J':
        event.preventDefault();
        options.onSkipBack();
        break;
      case 'ArrowRight':
      case 'l':
      case 'L':
        event.preventDefault();
        options.onSkipForward();
        break;
      case ',':
      case '[':
        options.onSpeedDown();
        break;
      case '.':
      case ']':
        options.onSpeedUp();
        break;
      case '?':
        options.onToggleOverlay();
        break;
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown));
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown));
}
