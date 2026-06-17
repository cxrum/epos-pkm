import type { JSONContent } from "@tiptap/core";
import type { EpObjectEntity } from "../../../../core/domain/type";
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
  if (typeId === "sys:heading") return "heading";
  if (typeId === "sys:text") return "paragraph";
  return "epBlock";
};

export const tiptapDocToEntities = (tiptapDoc: JSONContent): MappedArray => {
  if (!tiptapDoc.content) return { order: [], content: [] };

  const order: EpObjectId[] = [];
  const entities = tiptapDoc.content.map((node) => {
    console.log(node);
    const isNewNode = !node.attrs?.id;
    const typeId = !node.attrs?.typeId;
    const id = isNewNode ? crypto.randomUUID() : node.attrs?.id;
    order.push(id);

    let entityContent: any = [];

    const isTextBlock = node.type === "paragraph" || node.type === "heading";

    if (isTextBlock) {
      entityContent = node.content || [];
    } else {
      entityContent = node.attrs?.domainContent || {};
    }

    return {
      id: id,
      typeId: node.attrs?.typeId || "sys:text",
      physicalRelativePath: node.attrs?.physicalRelativePath || "",
      objectPath: node.attrs?.objectPath || [],
      props: node.attrs?.props || {},
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
