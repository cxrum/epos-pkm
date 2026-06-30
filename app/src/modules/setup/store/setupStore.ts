import { defineStore } from "pinia";
import { ref } from "vue";
import { appStateRepository } from "@/core/di/global";

interface Workspace {
  id: string;
  title: string;
  absolutePath: string;
}

export const useSetupStore = defineStore("setup", () => {
  const workspaces = ref<Workspace[]>([]);
  const isLoading = ref<boolean>(false);
  const errorMsg = ref<string | undefined>(undefined);

  const loadWorkspaces = async () => {
    isLoading.value = true;
    const _w = await appStateRepository.getWorkspaces();
    const _res: Workspace[] = [];

    for (const it of _w) {
      const local = await appStateRepository.getLocalWorkspace(it.id);
      if (local) {
        _res.push({
          id: local.id,
          title: local.title,
          absolutePath: it.absolutePath,
        });
      }
    }

    workspaces.value = _res;
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
