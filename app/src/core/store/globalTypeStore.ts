import { defineStore } from "pinia";
import type { TreeNode } from "@/shared/components/tree/contract";
import { globalTypingService } from "../di/global";
import { ref } from "vue";
import type { EpTypeId, Icon } from "../types";
import type { PropertyEntry } from "../application/type";

export interface PropertyGroup {
  id: string;
  title: string;
  icon?: Icon;
  items: PropertyEntry[];
}

export const useGlobalTypeStore = defineStore("global-type", () => {
  const treeStructure = ref<TreeNode>({ id: "-1", title: "-1", children: [] });
  const isTreeStructureLoading = ref(false);

  const rename = async (objId: EpTypeId, newTitle: string) => {
    const result = await globalTypingService.get(objId);
    if (result) {
      result.title = newTitle;
      await refreshTreeStructure();
    }
  };

  const refreshTreeStructure = async () => {
    isTreeStructureLoading.value = true;
    const result = await globalTypingService.getTree();
    treeStructure.value = result;
    isTreeStructureLoading.value = false;
  };

  return {
    treeStructure,
    isTreeStructureLoading,
    refreshTreeStructure,
    rename,
  };
});
