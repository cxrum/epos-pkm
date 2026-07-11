import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { VueRenderer } from "@tiptap/vue-3";
import tippy from "tippy.js";
import type { CommandControllerContract } from "./commandLineControllerContract.ts";
import CommandLineParserView from "./commandLine.vue";

export interface CommandParserOptions {
  controller: CommandControllerContract | null;
}

export const CommandParserPluginKey = new PluginKey("commandParser");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    commandParser: {
      parseCommand: (command: string) => ReturnType;
    };
  }
}

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
          if (!this.options.controller) {
            return false;
          }

          const { from, to } = editor.state.selection;
          this.options.controller.execute(command, editor, {
            from,
            to,
          });
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.controller) {
      return [];
    }

    const controller = this.options.controller;

    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        pluginKey: CommandParserPluginKey,

        items: async ({ query }) => {
          return await controller.fetchFiltered(query);
        },

        render: () => {
          let component: VueRenderer;
          let popup: any[];

          return {
            onStart: (props) => {
              console.log(props);
              component = new VueRenderer(CommandLineParserView, {
                props: {
                  items: props.items,
                  command: props.command,
                },
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },

            onUpdate(props) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popup[0].hide();
                return true;
              }
              return component.ref?.onKeyDown(props.event);
            },

            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
