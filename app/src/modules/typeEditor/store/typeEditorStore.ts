import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import type { EpTypeId } from "@/core/types";
import type { EpTypeEntity } from "@/core/domain/type";
import { globalTypingService } from "@/core/di/global";

export interface TypeTreeNodes {
  id: string;
  label: string;
}

export interface TypeTreeEdges {
  id: string;
  sourceId: string;
  target: string;
  label?: string;
}

export const useTypeEditorStore = defineStore("types", () => {
  const isTypeLoading = ref<boolean>(false);
  const selectedType: Ref<EpTypeEntity | undefined> = ref(undefined);

  const typeTreeNodes: Ref<TypeTreeNodes[]> = ref([]);
  const typeTreeEdges: Ref<TypeTreeEdges[]> = ref([]);

  const loadType = async (id: EpTypeId) => {
    isTypeLoading.value = false;
    selectedType.value = await globalTypingService.get(id);
    isTypeLoading.value = true;
  };

  const loadTree = async () => {
    isTypeLoading.value = true;
    const nodes = await globalTypingService.getAllTypes();
    const edges = globalTypingService.getEdges();

    const resNodes: TypeTreeNodes[] = [];
    const resEdges: TypeTreeEdges[] = [];

    for (const node of nodes) {
      resNodes.push({
        id: node.id,
        label: node.title,
      });
    }

    for (const edge of edges) {
      resEdges.push({
        id: `${edge.source}-${edge.target}`,
        sourceId: edge.source,
        target: edge.target,
      });
    }

    typeTreeEdges.value = resEdges;
    typeTreeNodes.value = resNodes;

    isTypeLoading.value = false;
  };

  return {
    isTypeLoading,
    selectedType,
    typeTreeNodes,
    typeTreeEdges,
    loadType,
    loadTree,
  };
});
