import { Node, mergeAttributes } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import EpBlockDispatcher from "./EpBlockDispatcher.vue";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import CodeBlock from "./blocks/CodeBlock.vue";
import { lowlight } from "lowlight";
import { TEXT_BLOCK_TYPES } from "../helpers.ts";

export const EpBaseBlock = Node.create({
  name: "epBlock",

  group: "block",
  content: "block*",
  draggable: true,

  addAttributes() {
    return {
      id: { default: null },
      typeId: { default: "def:unknown" },
      physicalRelativePath: { default: "" },
      objectPath: { default: [] },
      props: { default: {} },
      domainContent: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-ep-block]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const typeId = el.getAttribute("typeId");
          if (typeId && TEXT_BLOCK_TYPES.includes(typeId)) {
            return false;
          }
          return null;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-ep-block": "" }), 0];
  },

  addNodeView() {
    return VueNodeViewRenderer(EpBlockDispatcher);
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
