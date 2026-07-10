import { Extension } from "@tiptap/core";

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
});
