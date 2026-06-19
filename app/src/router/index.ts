import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/workspace/page",
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
        component: () => import("@/modules/typeEditor/layers/TypedEditor.vue"),

        children: [
          {
            name: "type-editor",
            path: "editor",
            component: () =>
              import("@/modules/typeEditor/layers/TypedEditor.vue"),
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
