import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/queue' },
    {
      path: '/queue',
      component: () => import('../features/work-queue/components/QueuePage.vue'),
    },
    {
      path: '/annotate/:id',
      component: () => import('../features/player/components/WorkspacePage.vue'),
      props: true,
    },
  ],
});
