import { ref } from "vue";
import { defineStore } from "pinia";
import { appStateRepository } from "@/core/di/global";

interface Workspace {
  id: string;
  title: string;
  relativePath: string;
}

interface WorkspaceDraft {
  id: string;
  title: string;
  isDraft: true;
}

export const useSetupStore = defineStore("setup", () => {
  const workspaces = ref<Workspace[]>([]);
  const draftWorkspaces = ref<WorkspaceDraft[]>([]);
  const workspacesRootPath = ref<string>("");
  const isLoading = ref<boolean>(false);
  const errorMsg = ref<string | undefined>(undefined);
  const warningMsg = ref<string | undefined>(undefined);

  const loadWorkspaces = async () => {
    isLoading.value = true;
    try {
      workspacesRootPath.value = await appStateRepository.getWorkspacesRootPath();
      const _w = await appStateRepository.getWorkspaces();
      const _res: Workspace[] = [];

      for (const it of _w) {
        const local = await appStateRepository.getLocalWorkspace(it.id);
        if (local) {
          _res.push({
            id: local.id,
            title: local.title,
            relativePath: it.relativePath,
          });
        }
      }

      workspaces.value = _res;
      const titleCounts = new Map<string, number>();
      for (const workspace of _res) {
        const normalizedTitle = workspace.title.trim().toLowerCase();
        if (!normalizedTitle) {
          continue;
        }

        titleCounts.set(
          normalizedTitle,
          (titleCounts.get(normalizedTitle) ?? 0) + 1,
        );
      }

      const hasDuplicateTitles = Array.from(titleCounts.values()).some(
        (count) => count > 1,
      );
      warningMsg.value = hasDuplicateTitles
        ? "Two workspaces share the same name. Rename one or merge them under a single id."
        : undefined;
      clearErrorMsg();
    } catch {
      errorMsg.value = "Cannot load workspace list";
    } finally {
      isLoading.value = false;
    }
  };

  const selectRootPath = async () => {
    isLoading.value = true;
    try {
      const path = await window.electronAPI.selectDirectory();
      if (!path) {
        return;
      }

      await appStateRepository.selectWorkspacesRoot(path);
      await loadWorkspaces();
      clearErrorMsg();
    } catch {
      errorMsg.value = "Cannot change workspace root";
    } finally {
      isLoading.value = false;
    }
  };

  const beginWorkspaceDraft = () => {
    draftWorkspaces.value.push({
      id: crypto.randomUUID(),
      title: "Untitled",
      isDraft: true,
    });
  };

  const cancelWorkspaceDraft = (draftId: string) => {
    draftWorkspaces.value = draftWorkspaces.value.filter(
      (item) => item.id !== draftId,
    );
  };

  const commitWorkspaceDraft = async (draftId: string) => {
    const draft = draftWorkspaces.value.find((item) => item.id === draftId);
    if (!draft) {
      return;
    }

    isLoading.value = true;
    try {
      await appStateRepository.createWorkspace(
        draft.title.trim().length ? draft.title.trim() : "Untitled",
      );
      draftWorkspaces.value = draftWorkspaces.value.filter(
        (item) => item.id !== draftId,
      );
      await loadWorkspaces();
      clearErrorMsg();
    } catch {
      errorMsg.value = "Cannot create workspace";
    } finally {
      isLoading.value = false;
    }
  };

  const createWorkspace = async (title: string) => {
    const draftId = crypto.randomUUID();
    draftWorkspaces.value.push({ id: draftId, title, isDraft: true });
    await commitWorkspaceDraft(draftId);
  };

  const renameWorkspace = async (id: string, title: string): Promise<boolean> => {
    isLoading.value = true;
    try {
      await appStateRepository.renameWorkspace(id, title);
      await loadWorkspaces();
      clearErrorMsg();
      return true;
    } catch {
      errorMsg.value = "Cannot rename workspace";
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteWorkspace = async (id: string): Promise<boolean> => {
    isLoading.value = true;
    try {
      await appStateRepository.deleteWorkspace(id);
      await loadWorkspaces();
      clearErrorMsg();
      return true;
    } catch {
      errorMsg.value = "Cannot delete workspace";
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const selectWorkspace = async (id: string): Promise<boolean> => {
    try {
      await loadWorkspaces();
      await appStateRepository.selectWorkspace(id);
      clearErrorMsg();
      return true;
    } catch {
      errorMsg.value = "Cannot open workspace";
      return false;
    }
  };

  const returnToChooser = async () => {
    await appStateRepository.clearSelectedWorkspace();
  };

  const clearErrorMsg = () => {
    errorMsg.value = undefined;
  };

  return {
    workspaces,
    draftWorkspaces,
    workspacesRootPath,
    isLoading,
    errorMsg,
    warningMsg,

    loadWorkspaces,
    createWorkspace,
    commitWorkspaceDraft,
    renameWorkspace,
    deleteWorkspace,
    selectRootPath,
    beginWorkspaceDraft,
    cancelWorkspaceDraft,
    clearErrorMsg,
    selectWorkspace,
    returnToChooser,
  };
});
