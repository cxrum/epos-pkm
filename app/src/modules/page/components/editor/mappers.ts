import type { JSONContent } from "@tiptap/core";
import {
  isHeadingInlineEntity,
  type BasePropertySchemeEntry,
  type DynamicPropertiesMap,
  type EpObjectEntity,
  type HeadingObjectPropertiesMap,
  type NumberValuedPropertyEntry,
} from "../../../../core/domain/type";
import type { EpObjectId } from "@/core/types";

export interface MappedArray {
  order: EpObjectId[];
  content: EpObjectEntity[];
}

export const entitiesToTiptapDoc = (
  entitiesRecord: Record<EpObjectId, EpObjectEntity>,
  order: EpObjectId[],
): JSONContent => {
  const sorted: EpObjectEntity[] = [];

  order.forEach((id) => {
    const entity = entitiesRecord[id];
    if (entity) {
      sorted.push(entity);
    }
  });

  return {
    type: "doc",
    content: sorted.map((entity) => {
      const tiptapType = mapEpTypeToTiptapType(entity.typeId);
      const isCustomBlock = tiptapType === "epBlock";

      const node: JSONContent = {
        type: tiptapType,
        attrs: {
          id: entity.id,
          typeId: entity.typeId,
          physicalRelativePath: entity.physicalRelativePath,
          objectPath: entity.objectPath,
          props: entity.props,
        },
      };

      if (tiptapType === "heading" && isHeadingInlineEntity(entity)) {
        node.attrs!.level = entity.props?.level?.value || 1;
      }

      if (isCustomBlock) {
        node.attrs!.domainContent = entity.content;
      } else {
        if (Array.isArray(entity.content) && entity.content.length > 0) {
          node.content = entity.content as JSONContent[];
        } else if (typeof entity.content === "string") {
          node.content = [{ type: "text", text: entity.content }];
        } else if (entity.content && typeof entity.content === "object") {
          const contentArray = Object.values(entity.content);
          if (contentArray.length > 0 && contentArray[0] !== undefined) {
            node.content = contentArray as JSONContent[];
          }
        }
      }

      return node;
    }),
  };
};

const mapEpTypeToTiptapType = (typeId: string): string => {
  if (typeId === "def:text") return "paragraph";
  if (typeId === "def:heading") return "heading";
  return "epBlock";
};

export const tiptapDocToEntities = (tiptapDoc: JSONContent): MappedArray => {
  if (!tiptapDoc.content) return { order: [], content: [] };

  const order: EpObjectId[] = [];
  const entities = tiptapDoc.content.map((node) => {
    console.log(node);
    const isNewNode = !node.attrs?.id;
    let resolvedTypeId = node.attrs?.typeId;
    const id = isNewNode ? crypto.randomUUID() : node.attrs?.id;
    order.push(id);

    let props = node.attrs?.props || {};
    let entityContent: any = [];

    const isTextBlock = node.type === "paragraph" || node.type === "heading";

    if (isTextBlock) {
      if (node.type === "heading") {
        if (!resolvedTypeId) resolvedTypeId = "def:heading";

        entityContent = node.content || [];
        const levelProperty = {
          id: "level",
          title: "level",
          type: "number",
          value: node.attrs?.level || 1,
        };
        props = { ...props, level: levelProperty };
      } else if (node.type === "paragraph") {
        if (!resolvedTypeId) resolvedTypeId = "def:text";

        entityContent = node.content || [];
      }
    } else {
      entityContent = node.attrs?.domainContent || {};
    }

    return {
      id: id,
      typeId: resolvedTypeId,
      physicalRelativePath: node.attrs?.physicalRelativePath || "",
      objectPath: node.attrs?.objectPath || [],
      props: props,
      content: entityContent,
    };
  });

  return {
    order: order,
    content: entities,
  };
};

export const mapObjectEntitiesToContent = (
  data: EpObjectEntity[],
): Record<EpObjectId, EpObjectEntity> => {
  const res: Record<EpObjectId, EpObjectEntity> = {};
  data.forEach((it) => {
    res[it.id] = it;
  });
  return res;
};
