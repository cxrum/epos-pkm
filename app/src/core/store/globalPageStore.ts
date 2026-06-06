import { defineStore } from "pinia";
import { ref } from "vue";
import type { ContainerObjectEntity, Path } from "../domain/type";
import type { TreeNode } from "@/shared/components/tree/contract";

export const useGlobalPageStore = defineStore("page", () => {
  const pageData = ref<ContainerObjectEntity>();
  const treeStructure = ref<TreeNode>({ id: -1, title: "root", children: [] });
  const paths = ref<Record<number, Path[]>>({});
  const isPageSaving = ref(false);
  const isPageLoading = ref(false);
  const isTreeStructureLoading = ref(false);

  const deep_traversal = (
    root: TreeNode,
    discovered: number[],
    paths: Record<number, Path[]>,
  ): Record<number, Path[]> => {
    if (!paths[root.id]) {
      paths[root.id] = [];
    }

    for (let index = 0; index < root.children.length; index++) {
      const el = root.children[index];
      if (!discovered.includes(el.id)) {
        discovered.push(el.id);

        if (paths[root.id]) {
          paths[el.id] = paths[root.id].concat({ id: el.id, title: el.title });
        } else {
          paths[root.id] = [];
        }

        deep_traversal(el, discovered, paths);
      }
    }
    return paths;
  };

  const index = () => {
    paths.value = deep_traversal(treeStructure.value, [], {});
  };

  index();

  const updateContent = async (conten: Object) => {
    if (pageData.value !== undefined) {
      pageData.value.content = conten;
      await saveToDatabase();
    }
  };

  const saveToDatabase = async () => {
    isPageSaving.value = true;
    if (pageData.value !== undefined) {
      await PageRepository.save(pageData.value);
    }
    isPageSaving.value = false;
  };

  const getFromDatabase = async (pageId: number) => {
    isPageLoading.value = true;
    const result = await PageRepository.get(pageId);
    if (result) {
      pageData.value = result;
    }
    isPageLoading.value = false;
  };

  const refreshTreeStructure = async () => {
    isTreeStructureLoading.value = true;
    const result = await TreeStructureRepository.get();
    treeStructure.value = result;
    index();
    isTreeStructureLoading.value = false;
  };

  const clearActivePage = async () => {
    pageData.value = undefined;
  };

  return {
    isPageSaving,
    isPageLoading,
    isTreeStructureLoading,
    pageData,
    treeStructure,
    paths,

    clearActivePage,
    refreshTreeStructure,
    updateContent,
    getFromDatabase,
  };
});
