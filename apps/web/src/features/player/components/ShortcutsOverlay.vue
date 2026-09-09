<script setup lang="ts">
defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const shortcuts = [
  { keys: 'Space',     action: 'Play / Pause' },
  { keys: '← / J',    action: 'Skip back 5 s' },
  { keys: '→ / L',    action: 'Skip forward 5 s' },
  { keys: ', / [',    action: 'Speed −0.25×' },
  { keys: '. / ]',    action: 'Speed +0.25×' },
  { keys: '?',        action: 'Toggle this overlay' },
];
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="overlay-backdrop"
      @click.self="emit('close')"
      @keydown.escape="emit('close')"
    >
      <div
        class="overlay-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div class="overlay-panel__header">
          <h2>Keyboard Shortcuts</h2>
          <button
            class="overlay-panel__close"
            aria-label="Close"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
        <table class="overlay-panel__table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sc in shortcuts"
              :key="sc.keys"
            >
              <td><kbd>{{ sc.keys }}</kbd></td>
              <td>{{ sc.action }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.overlay-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  min-width: 320px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.overlay-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.overlay-panel__header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}
.overlay-panel__close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #6b7280;
  padding: 4px;
}
.overlay-panel__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.overlay-panel__table th {
  text-align: left;
  padding: 6px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}
.overlay-panel__table td {
  padding: 8px 8px;
  border-bottom: 1px solid #f3f4f6;
}
kbd {
  display: inline-block;
  padding: 2px 6px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.8rem;
  white-space: nowrap;
}
</style>
