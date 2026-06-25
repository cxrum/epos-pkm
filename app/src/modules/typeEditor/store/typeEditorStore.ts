import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import type {
  EpPropertyId,
  EpPropertyTypes,
  EpTypeId,
  Icon,
} from "@/core/types";
import {
  isSystemProperty,
  isSystemType,
  type EpTypeEntity,
} from "@/core/domain/type";
import { globalTypingService } from "@/core/di/global";

export interface TypeTreeEdges {
  id: string;
  sourceId: string;
  target: string;
  label?: string;
}

export interface PropertyEntry {
  id: string;
  parentType?: Ancestor;
  title: string;
  icon: Icon;
  type: EpPropertyTypes;
  isChangeable: boolean;
  isSystem: boolean;
}

export interface Ancestor {
  id: string;
  title: string;
  icon?: Icon;
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

  const breadCrumbs: Ref<Ancestor[]> = ref([]);

  const getFullPropsScheme = async (
    typeId: EpTypeId,
  ): Promise<PropertyEntry[]> => {
    const resPropertyScheme: PropertyEntry[] = [];
    const rawScheme = await globalTypingService.getFullPropsScheme(typeId);

    if (rawScheme) {
      for (const propId of rawScheme.order) {
        const prop = rawScheme.props[propId];
        if (prop) {
          const parentType = rawScheme.inheritance.get(prop.id);
          let resParentType: Ancestor | undefined = undefined;
          if (parentType) {
            const type = await globalTypingService.get(parentType);
            if (type) {
              resParentType = {
                id: type.id,
                title: type.title,
                icon: type.icon,
              };
            }
          }

          resPropertyScheme.push({
            id: prop.id,
            parentType: resParentType,
            title: prop.title,
            type: prop.type,
            icon: resolveIcon(prop.type),
            isChangeable: prop.isChangeable,
            isSystem: isSystemProperty(prop),
          });
        }
      }
    }
    return resPropertyScheme;
  };

  const getPropsScheme = async (typeId: EpTypeId): Promise<PropertyEntry[]> => {
    const resPropertyScheme: PropertyEntry[] = [];
    const type = await globalTypingService.get(typeId);
    const rawScheme = type ? type.propertiesScheme : undefined;

    if (type && rawScheme) {
      for (const propId of rawScheme.order) {
        const prop = rawScheme.props[propId];
        resPropertyScheme.push({
          id: prop.id,
          parentType: undefined,
          title: prop.title,
          type: prop.type,
          icon: resolveIcon(prop.type),
          isChangeable: prop.isChangeable,
          isSystem: isSystemProperty(prop),
        });
      }
    }

    return resPropertyScheme;
  };

  const loadType = async (id: EpTypeId) => {
    isTypeLoading.value = true;
    type.value = await globalTypingService.get(id);
    if (type.value) {
      const res = await getFullPropsScheme(type.value.id);
      properties.value = res;
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
      console.log(_ancestors);
    } else {
      properties.value = [];
    }
    isTypeLoading.value = false;
  };

  const resolveIcon = (type: EpPropertyTypes): Icon => {
    if (type === "boolean") {
      return {
        type: "emoji",
        emoji: "B",
      };
    } else if (type === "number") {
      return {
        type: "emoji",
        emoji: "N",
      };
    } else if (type === "select") {
      return {
        type: "emoji",
        emoji: "S",
      };
    } else if (type === "text") {
      return {
        type: "emoji",
        emoji: "T",
      };
    } else {
      return {
        type: "emoji",
        emoji: "U",
      };
    }
  };

  const updateOrder = async (newOrder: EpTypeId[]) => {
    console.log(newOrder);
  };

  const updatePropertyType = async (
    property: EpPropertyId,
    type: EpPropertyTypes,
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
      const resPropertyScheme: PropertyEntry[] = await getPropsScheme(node.id);
      resNodes.push({
        id: node.id,
        label: node.title,
        isSystem: isSystemType(node),
        properties: resPropertyScheme,
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
