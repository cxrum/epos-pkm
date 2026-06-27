import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import type {
  EpPropertyId,
  EpPropertyType,
  EpTypeId,
  Icon,
} from "@/core/types";
import {
  isSystemProperty,
  isSystemType,
  type EpTypeEntity,
} from "@/core/domain/type";
import { globalTypingService } from "@/core/di/global";
import type { AncestorType, PropertyEntry } from "@/core/application/type";

export interface TypeTreeEdges {
  id: string;
  sourceId: string;
  target: string;
  label?: string;
}

export interface TypeTreeNodes {
  id: string;
  label: string;
  isSystem: boolean;
  properties: PropertyEntry[];
}

export const useTypeEditorStore = defineStore("types", () => {
  const isTypeLoading = ref<boolean>(false);
  const type: Ref<EpTypeEntity | undefined> = ref(undefined);

  const isSystemPropertiesVisible = ref<boolean>(true);

  const properties: Ref<PropertyEntry[]> = ref([]);

  const propertiesOrder: Ref<EpPropertyId[]> = ref([]);

  const typeTreeNodes: Ref<TypeTreeNodes[]> = ref([]);
  const typeTreeEdges: Ref<TypeTreeEdges[]> = ref([]);

  const breadCrumbs: Ref<AncestorType[]> = ref([]);

  const loadType = async (id: EpTypeId) => {
    isTypeLoading.value = true;
    type.value = await globalTypingService.get(id);
    if (type.value) {
      const res = await globalTypingService.getFullPropsScheme(type.value.id);
      properties.value = Array.from(res.props.values());
      propertiesOrder.value = properties.value.map((it) => it.id);
      const _ancestors = await globalTypingService.getAncestors(id);
      breadCrumbs.value = _ancestors.map((it) => {
        return {
          id: it.id,
          icon: it.icon,
          title: it.title,
        };
      });
      breadCrumbs.value.push({
        id: type.value.id,
        title: type.value.title,
        icon: type.value.icon,
      });
    } else {
      properties.value = [];
    }
    isTypeLoading.value = false;
  };

  const updateOrder = async (newOrder: EpTypeId[]) => {
    console.log(newOrder);
  };

  const updatePropertyType = async (
    property: EpPropertyId,
    type: EpPropertyType,
  ) => {
    console.log(property, type);
  };

  const loadTree = async () => {
    isTypeLoading.value = true;
    const nodes = await globalTypingService.getAllTypes();
    const edges = globalTypingService.getEdges();

    const resNodes: TypeTreeNodes[] = [];
    const resEdges: TypeTreeEdges[] = [];

    for (const node of nodes) {
      const resPropertyScheme = await globalTypingService.getPropsScheme(
        node.id,
      );

      resNodes.push({
        id: node.id,
        label: node.title,
        isSystem: isSystemType(node),
        properties: Array.from(resPropertyScheme.props.values()),
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
    type,
    propertiesOrder,
    properties,
    isSystemPropertiesVisible,
    typeTreeNodes,
    breadCrumbs,
    typeTreeEdges,

    loadType,
    loadTree,
    updateOrder,
    updatePropertyType,
  };
});
