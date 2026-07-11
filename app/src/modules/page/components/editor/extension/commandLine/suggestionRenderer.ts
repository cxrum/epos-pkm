import { VueRenderer } from "@tiptap/vue-3";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import CommandLineParserView from "./CommandLineParserView.vue";

export const renderItems = () => {
  let component: VueRenderer;
  let popup: TippyInstance[];
  let selectedIndex = 0;
  let currentProps: any = {};

  const onUpdateIndex = (index: number) => {
    selectedIndex = index;
    component.updateProps({ selectedIndex });
  };

  return {
    onStart: (props: any) => {
      currentProps = props;
      selectedIndex = 0;

      component = new VueRenderer(CommandLineParserView, {
        props: {
          ...props,
          selectedIndex,
          onUpdateIndex,
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

    onUpdate(props: any) {
      currentProps = props;
      selectedIndex = 0;

      component.updateProps({
        ...props,
        selectedIndex,
        onUpdateIndex,
      });

      if (!props.clientRect) {
        return;
      }

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === "Escape") {
        popup[0].hide();
        return true;
      }

      if (!currentProps.items || currentProps.items.length === 0) {
        return false;
      }

      if (props.event.key === "ArrowUp") {
        selectedIndex =
          (selectedIndex + currentProps.items.length - 1) %
          currentProps.items.length;
        component.updateProps({ selectedIndex });
        return true;
      }

      if (props.event.key === "ArrowDown") {
        selectedIndex = (selectedIndex + 1) % currentProps.items.length;
        component.updateProps({ selectedIndex });
        return true;
      }

      if (props.event.key === "Enter") {
        const item = currentProps.items[selectedIndex];
        if (item) {
          currentProps.command(item);
        }
        return true;
      }

      return false;
    },

    onExit() {
      if (popup && popup[0]) {
        popup[0].destroy();
      }
      if (component) {
        component.destroy();
      }
    },
  };
};
