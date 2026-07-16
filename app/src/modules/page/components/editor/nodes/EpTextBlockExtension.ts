import { Node, mergeAttributes } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import EpTextBlockDispatcher from "./EpTextBlockDispatcher.vue";
import { TEXT_BLOCK_TYPES } from "../helpers.ts";

export const EpTextBlock = Node.create({
  name: "epTextBlock",

  group: "block",
  content: "inline*",
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
    return [
      {
        tag: "div[data-ep-text-block]",
      },
      {
        tag: "div[data-ep-block]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const typeId = el.getAttribute("typeId");
          if (typeId && TEXT_BLOCK_TYPES.includes(typeId)) {
            return null;
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-ep-text-block": "" }),
      0,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(EpTextBlockDispatcher);
  },
});
