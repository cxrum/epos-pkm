import type { JSONContent } from "@tiptap/core";
import type { EpObjectId } from "@/core/types";
import {
  type EpInlineObjectEntity,
  type EpObjectEntity,
} from "@/core/domain/type";
import { mapEpTypeToTiptapType } from "./helpers";

export const domainPropertyToTiptap = (
  tiptapType: string,
  props: Record<string, any> = {},
): Record<string, any> => {
  const attrs: Record<string, any> = {};

  if (tiptapType === "heading" && props.level) {
    attrs.level = props.level.value;
  } else if (tiptapType === "codeBlock" && props.codeLanguage) {
    attrs.language = props.codeLanguage.value;
  }

  return attrs;
};

export const tipTapPropertyToDomain = (
  nodeType: string,
  attrs: Record<string, any> = {},
  existingProps: Record<string, any> = {},
): Record<string, any> => {
  const props = { ...existingProps };

  if (nodeType === "heading") {
    props.level = {
      id: "level",
      title: "level",
      type: "number",
      value: attrs.level || 1,
    };
  } else if (nodeType === "codeBlock") {
    props.codeLanguage = {
      id: "codeLanguage",
      title: "Code language",
      type: "text",
      value: attrs.language || "",
    };
  }

  return props;
};

export interface MappedArray {
  order: EpObjectId[];
  content: EpObjectEntity[];
}

export const entitiesToTiptapDoc = (
  entitiesRecord: Record<EpObjectId, EpInlineObjectEntity>,
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
      const mappedAttrs = domainPropertyToTiptap(tiptapType, entity.props);

      const node: JSONContent = {
        type: tiptapType,
        attrs: {
          id: entity.id,
          typeId: entity.typeId,
          physicalRelativePath: entity.physicalRelativePath,
          objectPath: entity.objectPath,
          props: entity.props,
          ...mappedAttrs,
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

export const tiptapDocToEntities = (tiptapDoc: JSONContent): MappedArray => {
  if (!tiptapDoc.content) return { order: [], content: [] };

  const order: EpObjectId[] = [];
  const entities = tiptapDoc.content.map((node) => {
    const isNewNode = !node.attrs?.id;
    let resolvedTypeId = node.attrs?.typeId;
    const id = isNewNode ? crypto.randomUUID() : node.attrs?.id;
    order.push(id);

    const props = tipTapPropertyToDomain(
      node.type || "",
      node.attrs || {},
      node.attrs?.props || {},
    );

    let entityContent: any = [];

    const isTextBlock =
      node.type === "paragraph" ||
      node.type === "heading" ||
      node.type === "codeBlock";

    if (isTextBlock) {
      if (node.type === "heading" && !resolvedTypeId) {
        resolvedTypeId = "def:heading";
      } else if (node.type === "paragraph" && !resolvedTypeId) {
        resolvedTypeId = "def:text";
      } else if (node.type === "codeBlock" && !resolvedTypeId) {
        resolvedTypeId = "def:code";
      }

      entityContent = node.content || [];
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