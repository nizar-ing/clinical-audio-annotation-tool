import { ref, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

export interface TextSelection {
  startOffset: number;
  endOffset: number;
  anchorText: string;
  rect: DOMRect;
}

// Watches window.getSelection() and reports character offsets INTO a given root
// element. Only ranges that live entirely inside the root are surfaced.
export function useSpanSelection(rootEl: Ref<HTMLElement | null>) {
  const current = ref<TextSelection | null>(null);

  function handleSelectionChange() {
    const sel = window.getSelection();
    const root = rootEl.value;
    if (!sel || sel.rangeCount === 0 || !root) {
      current.value = null;
      return;
    }
    const range = sel.getRangeAt(0);
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
      current.value = null;
      return;
    }
    const anchorText = range.toString();
    if (anchorText.length === 0) {
      current.value = null;
      return;
    }
    const startOffset = offsetOf(root, range.startContainer, range.startOffset);
    const endOffset = offsetOf(root, range.endContainer, range.endOffset);
    if (startOffset < 0 || endOffset < 0 || endOffset <= startOffset) {
      current.value = null;
      return;
    }
    current.value = { startOffset, endOffset, anchorText, rect: range.getBoundingClientRect() };
  }

  function clear() {
    current.value = null;
    window.getSelection()?.removeAllRanges();
  }

  onMounted(() => document.addEventListener('selectionchange', handleSelectionChange));
  onUnmounted(() => document.removeEventListener('selectionchange', handleSelectionChange));

  return { current, clear };
}

// Walk root's text nodes in document order until we reach `node`, summing lengths.
function offsetOf(root: HTMLElement, node: Node, offsetInNode: number): number {
  let total = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (current === node) return total + offsetInNode;
    total += (current.textContent ?? '').length;
  }
  // Fallback: if node is an element (contenteditable weirdness), try its first descendant text.
  if (node.nodeType === Node.ELEMENT_NODE) {
    let acc = 0;
    const w2 = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while ((current = w2.nextNode())) {
      if (node.contains(current)) return acc + offsetInNode;
      acc += (current.textContent ?? '').length;
    }
  }
  return -1;
}
