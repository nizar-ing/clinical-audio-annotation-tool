<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="app">
    <nav class="app-nav">
      <span class="app-nav__brand">ClinAnnotate</span>
      <RouterLink
        to="/queue"
        class="app-nav__link"
      >
        Queue
      </RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
  background: #ffffff;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
}
.app-nav {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}
.app-nav__brand {
  font-weight: 700;
  font-size: 1rem;
  color: #6366f1;
}
.app-nav__link {
  font-size: 0.875rem;
  color: #374151;
  text-decoration: none;
  font-weight: 500;
}
.app-nav__link:hover,
.app-nav__link.router-link-active {
  color: #6366f1;
}
</style>
