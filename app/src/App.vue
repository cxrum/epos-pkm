<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import ContextMenu from "./shared/components/contextMenu/ContextMenu.vue";
import { useWorkspaceStore } from "./core/store/workspaceStore";

const router = useRouter();
const workspaceStore = useWorkspaceStore();
let removeWorkspaceChooserListener: (() => void) | undefined;

onMounted(() => {
  removeWorkspaceChooserListener = window.electronAPI.onOpenWorkspaceChooser(
    () => {
      void window.appState.clearSelectedWorkspace().then(async () => {
        await workspaceStore.loadAppState();
        await router.push({ name: "setup" });
      });
    },
  );
});

onUnmounted(() => {
  removeWorkspaceChooserListener?.();
});
</script>

<template>
  <router-view></router-view>
  <context-menu />
</template>
