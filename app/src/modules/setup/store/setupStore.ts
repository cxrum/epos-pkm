import { defineStore } from "pinia";
import { ref } from "vue";
import type { Workspace } from "../../../../appState";
import { appStateRepository } from "@/core/di/global";

export const useSetupStore = defineStore("setup", () => {
  const workspaces = ref<Workspace[]>([]);
  const isLoading = ref<boolean>(false);

  const loadWorkspaces = async () => {
    isLoading.value = true;
    workspaces.value = await appStateRepository.getWorkspaces();
    isLoading.value = false;
  };

  return {
    workspaces,

    loadWorkspaces,
  };
});
