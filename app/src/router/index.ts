import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/workspace'
  },
  {
    path: '/workspace',
    component: () => import('@/core/layouts/WorkspaceLayout.vue'),
    children: [
      {
          path: '',
          component: () => import('@/modules/page/layouts/PageView.vue')
      },
      {
        path: 'settings',
        components: {
          default: () => import('@/modules/page/layouts/PageView.vue'),
          modal: () => import('@/modules/settings/layouts/SettingsLayout.vue')
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router