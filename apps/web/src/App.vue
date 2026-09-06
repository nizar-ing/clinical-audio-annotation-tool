<script setup lang="ts">
import { ref, onMounted } from 'vue';

const status = ref<string | null>(null);
const error = ref<string | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetch('/api/v1/health');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data: { status: string } };
    status.value = json.data.status;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div style="font-family: monospace; padding: 2rem">
    <h1>ClinAnnotate</h1>
    <p v-if="loading">
      Connecting to API…
    </p>
    <p
      v-else-if="error"
      style="color: red"
    >
      API error: {{ error }}
    </p>
    <p v-else>
      API status: <strong>{{ status }}</strong>
    </p>
  </div>
</template>
