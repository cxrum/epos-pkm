import { createRouter, createWebHistory } from 'vue-router'
import WorkspaceLayout from '../core/layouts/WorkspaceLayout.vue'

const routes = [
  {
    path: '/',
    redirect: '/workspace'
  },
  {
    path: '/workspace',
    component: WorkspaceLayout,
    children: [
        {
            path: '',
            component: () => import('../modules/page/layouts/PageView.vue')
        },
        {
          path: 'settings',
          components: {
            default: () => import('../modules/page/layouts/PageView.vue'),
            modal: () => import('../core/layouts/SettingsLayout.vue')
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