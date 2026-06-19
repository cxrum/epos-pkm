import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/workspace",
  },
  {
    path: "/workspace",
    component: () => import("@/core/layouts/WorkspaceLayout.vue"),
    children: [
      {
        name: "default-workspace",
        path: "page",
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
