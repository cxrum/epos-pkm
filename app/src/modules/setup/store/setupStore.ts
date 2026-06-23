import { defineStore } from "pinia";
import { ref } from "vue";
import type { Workspace } from "../../../../appState";
import { appStateRepository, workspaceStateRepository } from "@/core/di/global";

export const useSetupStore = defineStore("setup", () => {
  const workspaces = ref<Workspace[]>([]);
  const isLoading = ref<boolean>(false);
  const errorMsg = ref<string | undefined>(undefined);

  const loadWorkspaces = async () => {
    isLoading.value = true;
    workspaces.value = await appStateRepository.getWorkspaces();
    isLoading.value = false;
  };

  const loadWorkspace = async (_path: string) => {
    isLoading.value = true;
    try {
      await appStateRepository.loadWorkspace(_path);
      await loadWorkspaces();
      clearErrorMsg();
    } catch {
      errorMsg.value = "Cannot load workspace";
    }
    isLoading.value = false;
  };

  const createWorkspace = async (title: string, _path: string) => {
    isLoading.value = true;
    try {
      await appStateRepository.createWorkspace(title, _path);
      await loadWorkspaces();
      clearErrorMsg();
    } catch {
      errorMsg.value = "Cannot load workspace";
    }

    isLoading.value = false;
  };

  const selectWorkspace = async (id: string) => {
    await appStateRepository.selectWorkspace(id);
  };

  const clearErrorMsg = () => {
    errorMsg.value = undefined;
  };

  return {
    workspaces,
    isLoading,
    errorMsg,

    loadWorkspaces,
    createWorkspace,
    loadWorkspace,
    clearErrorMsg,
    selectWorkspace,
  };
});
