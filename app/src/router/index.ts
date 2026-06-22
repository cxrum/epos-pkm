import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "setup",
    component: () => import("@/modules/setup/layout/InitialConfigLayout.vue"),
  },
  {
    name: "workspace",
    path: "/workspace",
    meta: { requiresWorkspace: true },
    component: () => import("@/core/layouts/WorkspaceLayout.vue"),
    children: [
      {
        name: "page-editor",
        path: "page/:id",
        component: () => import("@/modules/page/layouts/PageLayout.vue"),
      },
      {
        path: "type",
        redirect: "type-graph",
        children: [
          {
            name: "type-editor",
            path: "editor/:id",
            component: () =>
              import("@/modules/typeEditor/layers/TypedEditor.vue"),
          },
          {
            name: "type-graph",
            path: "graph",
            component: () => import("@/modules/typeEditor/layers/TypeList.vue"),
          },
        ],
      },
      {
        path: "settings",
        components: {
          modal: () => import("@/modules/settings/layouts/SettingsLayout.vue"),
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
