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
  // Editor-phase additions — all optional so callers that don't use them keep working.
  onOpenTypePicker?: () => void;
  onSaveNow?: () => void;
  onCompleteAndNext?: () => void;
}

// The editor uses contenteditable, which does not match INPUT/TEXTAREA. We still
// need to disable transport-style shortcuts (Space, arrows) while the caret is
// inside it — but Ctrl+S and Ctrl+Enter should ALWAYS work.
function isEditableFocused(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable;
}

export function useKeyboardShortcuts(options: ShortcutOptions) {
  function handleKeydown(event: KeyboardEvent) {
    if (!options.enabled.value) return;

    // Ctrl+S / Cmd+S — always active.
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      options.onSaveNow?.();
      return;
    }

    // Ctrl+Enter / Cmd+Enter — always active.
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      options.onCompleteAndNext?.();
      return;
    }

    if (isEditableFocused()) return;

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
      case 't':
      case 'T':
        if (options.onOpenTypePicker) {
          event.preventDefault();
          options.onOpenTypePicker();
        }
        break;
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown));
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown));
}
