import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const UniqueBlockIdExtension = Extension.create({
  name: "uniqueBlockId",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("uniqueBlockId"),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((tr) => tr.docChanged)) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;

          newState.doc.descendants((node, pos) => {
            if (node.isBlock && node.type.name !== "text") {
              const id = node.attrs.id;

              if (id) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  id: undefined,
                });
                modified = true;
              } else {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  id: undefined,
                });
                modified = true;
              }
            }
          });
          return modified ? tr : null;
        },
      }),
    ];
  },
});
