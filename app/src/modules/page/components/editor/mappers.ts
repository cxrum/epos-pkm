import type { JSONContent } from "@tiptap/core";
import type { EpObjectEntity } from "../../../../core/domain/type";
import type { EpObjectId } from "@/core/types";

export const entitiesToTiptapDoc = (
  entities: EpObjectEntity[],
): JSONContent => {
  return {
    type: "doc",
    content: entities.map((entity) => {
      const tiptapType = mapEpTypeToTiptapType(entity.typeId);

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

      if (
        entity.content &&
        typeof entity.content === "object" &&
        !Array.isArray(entity.content)
      ) {
        const contentArray = Object.values(entity.content);

        if (contentArray.length > 0 && contentArray[0] !== undefined) {
          node.content = contentArray as JSONContent[];
        }
      } else if (Array.isArray(entity.content) && entity.content.length > 0) {
        node.content = entity.content as JSONContent[];
      }

      return node;
    }),
  };
};

export const mapEntityRecordsToArray = (
  data: Record<EpObjectId, any>,
): EpObjectEntity[] => {
  const res: EpObjectEntity[] = Object.values(data);
  return res;
};

const mapEpTypeToTiptapType = (typeId: string): string => {
  if (typeId === "sys:heading") return "heading";
  return "paragraph";
};

export const tiptapDocToEntities = (
  tiptapDoc: JSONContent,
): EpObjectEntity[] => {
  if (!tiptapDoc.content) return [];

  return tiptapDoc.content.map((node) => {
    const isNewNode = !node.attrs?.id;

    return {
      id: isNewNode ? crypto.randomUUID() : node.attrs?.id, // TODO: Create a domain based factory for empty objects
      typeId: node.attrs?.typeId || "sys:paragraph",
      physicalRelativePath: node.attrs?.physicalRelativePath || "",
      objectPath: node.attrs?.objectPath || [],
      props: node.attrs?.props || {},
      content: node.content || [],
    };
  });
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
