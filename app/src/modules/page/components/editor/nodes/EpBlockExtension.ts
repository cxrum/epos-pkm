import { Node, mergeAttributes } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import EpBlockDispatcher from "./EpBlockDispatcher.vue";

export const EpBlockExtension = Node.create({
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
});
