import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const UniqueBlockIdExtension = Extension.create({
  name: "uniqueBlockId",

  addKeyboardShortcuts() {
    return {
      "Shift-Enter": () => {
        const { state, dispatch } = this.editor.view;
        const { $from, $to } = state.selection;
        const parentNode = $from.node($from.depth);

        if (!parentNode || !parentNode.isBlock) return false;

        if (["paragraph"].includes(parentNode.type.name)) {
          return false;
        }

        if (dispatch) {
          const newAttrs = { ...parentNode.attrs };
          newAttrs.id = crypto.randomUUID();

          let tr = state.tr.delete($from.pos, $to.pos);

          tr = tr.split(tr.mapping.map($from.pos), 1, [
            { type: parentNode.type, attrs: newAttrs },
          ]);

          dispatch(tr.scrollIntoView());
        }

        return true;
      },

      Enter: () => {
        const { state, dispatch } = this.editor.view;
        const { $from, $to } = state.selection;
        const parentNode = $from.node($from.depth);

        if (!parentNode || !parentNode.isBlock) return false;

        if (
          ["listItem", "bulletList", "orderedList", "codeBlock"].includes(
            parentNode.type.name,
          )
        ) {
          return false;
        }

        if (dispatch) {
          const cleanType = state.schema.nodes.paragraph || parentNode.type;

          let tr = state.tr.delete($from.pos, $to.pos);

          tr = tr.split(tr.mapping.map($from.pos), 1, [
            { type: cleanType, attrs: { id: crypto.randomUUID() } },
          ]);

          dispatch(tr.scrollIntoView());
        }

        return true;
      },
    };
  },

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
