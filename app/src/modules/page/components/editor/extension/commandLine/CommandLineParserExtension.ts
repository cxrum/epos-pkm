import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { renderItems } from "./suggestionRenderer";
import type { CommandControllerContract } from "./commandLineControllerContract";
export interface CommandParserOptions {
  controller: CommandControllerContract | null;
}

export const CommandParserPluginKey = new PluginKey("commandParser");

export const CommandLineParser = Extension.create<CommandParserOptions>({
  name: "commandLineParser",

  addOptions() {
    return {
      controller: null,
    };
  },

  addCommands() {
    return {
      parseCommand:
        (command: string) =>
        ({ editor }) => {
          if (!this.options.controller) return false;

          const { from, to } = editor.state.selection;
          const id = this.options.controller.parse(command);
          if (!id) {
            return false;
          }

          this.options.controller.execute(id, editor, {
            from,
            to,
          });
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.controller) return [];

    const controller = this.options.controller;

    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        pluginKey: CommandParserPluginKey,

        items: async ({ query }) => {
          return await controller.fetchFiltered(query);
        },

        command: ({ editor, range, props }) => {
          console.log(props.id);
          controller.execute(props.id, editor, {}, range);
        },

        render: renderItems,
      }),
    ];
  },
});
