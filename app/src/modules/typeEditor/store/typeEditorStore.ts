import { ref, type Ref } from "vue";
import { defineStore } from "pinia";
import type {
  EpPropertyId,
  EpPropertyTypes,
  EpTypeId,
  Icon,
} from "@/core/types";
import { isSystemProperty, type EpTypeEntity } from "@/core/domain/type";
import { globalTypingService } from "@/core/di/global";

export interface TypeTreeEdges {
  id: string;
  sourceId: string;
  target: string;
  label?: string;
}

export interface PropertyEntry {
  id: string;
  parentType?: EpTypeId;
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

  const loadType = async (id: EpTypeId) => {
    isTypeLoading.value = true;
    type.value = await globalTypingService.get(id);
    if (type.value) {
      const res = await getPropsScheme(type.value);
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

  const getPropsScheme = async (
    type: EpTypeEntity,
  ): Promise<PropertyEntry[]> => {
    const rawScheme = await globalTypingService.getFullPropsScheme(type.id);
    const res: PropertyEntry[] = [];
    console.log(rawScheme);

    for (const key of rawScheme.order) {
      const entry = rawScheme.props[key];
      const _res = {
        id: entry.id,
        title: entry.title,
        type: entry.type,
        icon: resolveIcon(entry.type),
        isChangeable: entry.isChangeable,
        isSystem: isSystemProperty(entry),
      };
      res.push(_res);
    }

    return res;
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
      const resPropertyScheme: PropertyEntry[] = [];
      const rawScheme = await globalTypingService.getFullPropsScheme(node.id);

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
              parentType: rawScheme.inheritance.get(prop.id),
              title: prop.title,
              type: prop.type,
              icon: resolveIcon(prop.type),
              isChangeable: prop.isChangeable,
              isSystem: isSystemProperty(prop),
            });
          }
        }
      }

      resNodes.push({
        id: node.id,
        label: node.title,
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
