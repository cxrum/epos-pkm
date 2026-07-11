import { Node, mergeAttributes } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import EpBlockDispatcher from "./EpBlockDispatcher.vue";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import CodeBlock from "./blocks/CodeBlock.vue";
import { lowlight } from "lowlight";
import type { EpObjectId } from "@/core/types.ts";
import { mapEpTypeToTiptapType } from "../helpers.ts";
import { domainPropertyToTiptap, tipTapPropertyToDomain } from "../mappers.ts";

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

export const EpBaseBlock = Node.create({
  name: "epBlock",

  group: "block",
  content: "block*",
  draggable: true,

  addAttributes() {
    return {
      id: { default: null },
      typeId: { default: "def:text" },
      physicalRelativePath: { default: "" },
      objectPath: { default: [] },
      props: { default: {} },
      domainContent: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-ep-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-ep-block": "" }), 0];
  },

  addNodeView() {
    return VueNodeViewRenderer(EpBlockDispatcher);
  },

  addCommands() {
    return {
      insertInlineObject:
        (options) =>
        ({ commands }) => {
          const { id, typeId, props = {} } = options;
          const resType = mapEpTypeToTiptapType(typeId);
          const tipTapProperty = domainPropertyToTiptap(resType, props);
          return commands.insertContent({
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

export const EpCodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: { default: null },
      typeId: { default: "def:text" },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(CodeBlock);
  },
}).configure({
  lowlight,
  defaultLanguage: "plaintext",
});
