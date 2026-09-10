<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Component } from 'vue';
import { Stethoscope, Ruler, Hash, Pilcrow, Users, Type } from 'lucide-vue-next';
import type { SpanAttributes } from 'contracts';
import type { SpanType } from '../api/annotation.api.js';
import MedicalTermForm from './attribute-forms/MedicalTermForm.vue';
import MeasurementForm from './attribute-forms/MeasurementForm.vue';
import NumberForm from './attribute-forms/NumberForm.vue';
import FormattingCommandForm from './attribute-forms/FormattingCommandForm.vue';
import NamedEntityForm from './attribute-forms/NamedEntityForm.vue';
import SpelledOutForm from './attribute-forms/SpelledOutForm.vue';

const props = defineProps<{ anchorRect: DOMRect | null; anchorText: string }>();
const emit = defineEmits<{
  submit: [attributes: SpanAttributes];
  cancel: [];
}>();

interface TypeOption {
  key: SpanType;
  label: string;
  icon: Component;
  hotkey: string;
}

const TYPES: TypeOption[] = [
  { key: 'MEDICAL_TERM',       label: 'Medical term',   icon: Stethoscope, hotkey: '1' },
  { key: 'MEASUREMENT',        label: 'Measurement',    icon: Ruler,       hotkey: '2' },
  { key: 'NUMBER',             label: 'Number',         icon: Hash,        hotkey: '3' },
  { key: 'FORMATTING_COMMAND', label: 'Formatting cmd', icon: Pilcrow,     hotkey: '4' },
  { key: 'NAMED_ENTITY',       label: 'Named entity',   icon: Users,       hotkey: '5' },
  { key: 'SPELLED_OUT',        label: 'Spelled out',    icon: Type,        hotkey: '6' },
];

const chosenType = ref<SpanType | null>(null);

// Freeze the anchor position once a form type is chosen. Focusing form inputs
// (type=text, select, number) triggers selectionchange in the browser, which
// clears the correctedEl selection and propagates to anchorRect = null —
// collapsing the popover mid-fill. By freezing here and only unfreezing on
// explicit submit/cancel, we prevent that race.
const frozenAnchorRect = ref<DOMRect | null>(null);
const frozenAnchorText = ref('');

watch(
  () => props.anchorRect,
  (rect) => { if (chosenType.value === null) frozenAnchorRect.value = rect; },
  { immediate: true },
);

watch(
  () => props.anchorText,
  (text) => { if (chosenType.value === null) frozenAnchorText.value = text; },
  { immediate: true },
);

const formComponent = computed<Component | null>(() => {
  switch (chosenType.value) {
    case 'MEDICAL_TERM': return MedicalTermForm;
    case 'MEASUREMENT':  return MeasurementForm;
    case 'NUMBER':       return NumberForm;
    case 'FORMATTING_COMMAND': return FormattingCommandForm;
    case 'NAMED_ENTITY': return NamedEntityForm;
    case 'SPELLED_OUT':  return SpelledOutForm;
    default: return null;
  }
});

const style = computed(() => {
  if (!frozenAnchorRect.value) return { display: 'none' };
  const rect = frozenAnchorRect.value;
  // getBoundingClientRect() returns viewport-relative coordinates.
  // position:fixed also uses viewport coordinates — scrollY/X must NOT be added.
  // Flip above the selection when there isn't enough space below.
  const POPOVER_HEIGHT = 300;
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const top = spaceBelow >= POPOVER_HEIGHT
    ? rect.bottom + 8
    : Math.max(8, rect.top - POPOVER_HEIGHT - 8);
  const left = Math.min(rect.left, window.innerWidth - 320);
  return { top: `${top}px`, left: `${Math.max(8, left)}px` };
});

function handleSubmit(attrs: SpanAttributes) {
  frozenAnchorRect.value = null;
  chosenType.value = null;
  emit('submit', attrs);
}

function handleCancel() {
  frozenAnchorRect.value = null;
  chosenType.value = null;
  emit('cancel');
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { handleCancel(); return; }
  if (chosenType.value !== null) return; // digit hotkeys only when picking type
  const match = TYPES.find((t) => t.hotkey === event.key);
  if (match) {
    event.preventDefault();
    chosenType.value = match.key;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="frozenAnchorRect"
      class="fixed z-50"
      :style="style"
      role="dialog"
      aria-label="Annotate span"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <div class="bg-white rounded-xl shadow-2xl border border-warm-200 w-80 p-4">
        <p class="font-sans text-xs font-semibold uppercase tracking-widest text-warm-400 m-0 mb-3">
          Annotate
          <span class="font-mono normal-case tracking-normal text-warm-700 ml-1">"{{ frozenAnchorText }}"</span>
        </p>

        <div
          v-if="!chosenType"
          class="grid grid-cols-2 gap-2"
        >
          <button
            v-for="t in TYPES"
            :key="t.key"
            class="flex items-center gap-2 font-sans text-sm border border-warm-200 bg-white hover:bg-sage-50 hover:border-sage-300 text-warm-800 rounded-lg px-3 py-2 transition-colors cursor-pointer text-left"
            :title="`${t.label} (press ${t.hotkey})`"
            @click="chosenType = t.key"
          >
            <component
              :is="t.icon"
              :size="14"
              :stroke-width="1.75"
              class="text-sage-600 shrink-0"
            />
            <span class="flex-1">{{ t.label }}</span>
            <kbd class="font-mono text-xs text-warm-400">{{ t.hotkey }}</kbd>
          </button>
        </div>

        <component
          :is="formComponent"
          v-if="chosenType && formComponent"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </Teleport>
</template>
