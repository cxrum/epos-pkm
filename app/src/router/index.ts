import { useWorkspaceStore } from "@/core/store/workspaceStore";
import { useAuthStore } from "@/core/store/authStore";
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
            component: () =>
              import("@/modules/typeEditor/layers/TypeGraph.vue"),
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
router.beforeEach(async (to, from, next) => {
  const workspaceStore = useWorkspaceStore();
  const authStore = useAuthStore();

  if (!workspaceStore.selectedWorkspace) {
    await workspaceStore.loadAppState();
  }

  if (!authStore.authState) {
    await authStore.loadAuthState();
  }

  const hasWorkspace = workspaceStore.selectedWorkspace ? true : false;

  if (hasWorkspace) {
    if (!workspaceStore.isInitialized) {
      await workspaceStore.init();
      console.log("INIT");
    }
  }

  if (to.meta.requiresWorkspace && !hasWorkspace) {
    next({ name: "setup" });
  } else if (to.name === "setup" && hasWorkspace) {
    next({ name: "workspace" });
  } else {
    next();
  }
});

export default router;
