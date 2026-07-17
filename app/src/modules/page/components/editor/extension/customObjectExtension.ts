import type { EpObjectId } from "@/core/types";
import { Extension } from "@tiptap/core";
import { domainPropertyToTiptap } from "../mappers";
import { mapEpTypeToTiptapType } from "../helpers";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    epCustomCommands: {
      insertInlineObject: (options: {
        id: EpObjectId;
        typeId: string;
        props?: Record<string, any>;
        tiptapType?: string;
      }) => ReturnType;
    };
  }
}

export const EpObjectAttributesExtension = Extension.create({
  name: "epObjectAttributes",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading", "image", "taskList", "codeBlock"],
        attributes: {
          id: {
            default: null,
            renderHTML: (attributes) => {
              if (!attributes.id) return {};
              return { "data-ep-id": attributes.id };
            },
            parseHTML: (element) => element.getAttribute("data-ep-id"),
          },
          typeId: { default: null },
        },
      },
    ];
  },

  addCommands() {
    return {
      insertInlineObject:
        (options) =>
        ({ commands, state }) => {
          const { id, typeId, props = {}, pos } = options;
          const resType = mapEpTypeToTiptapType(typeId);
          const tipTapProperty = domainPropertyToTiptap(resType, props);

          const targetPos = pos ?? state.selection.head;

          return commands.insertContentAt(targetPos, {
            type: resType,
            attrs: {
              id: id,
              typeId: typeId,
              props: props,
              ...tipTapProperty,
            },
          });
        },
    };
  },
});
