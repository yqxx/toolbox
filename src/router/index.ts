import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/index.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/home.vue'),
        },
        {
          path: 'tools/url-codec',
          name: 'url-codec',
          component: () => import('@/views/url-codec.vue'),
        },
        {
          path: 'tools/timestamp',
          name: 'timestamp',
          component: () => import('@/views/timestamp.vue'),
        },
        {
          path: 'tools/password-generator',
          name: 'password-generator',
          component: () => import('@/views/password-generator.vue'),
        },
        {
          path: 'tools/ico-generator',
          name: 'ico-generator',
          component: () => import('@/views/ico-generator.vue'),
        },
        {
          path: 'tools/svg-editor',
          name: 'svg-editor',
          component: () => import('@/views/svg-editor.vue'),
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
