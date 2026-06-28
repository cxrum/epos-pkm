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

          const usedIds = new Set<string>();

          newState.doc.descendants((node, pos) => {
            if (node.isBlock && node.type.name !== "text") {
              const id = node.attrs.id;

              if (!id) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  id: crypto.randomUUID(),
                });
                modified = true;
              } else if (usedIds.has(id)) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  id: crypto.randomUUID(),
                });
                modified = true;
              } else {
                usedIds.add(id);
              }
            }
          });
          return modified ? tr : null;
        },
      }),
    ];
  },
});
