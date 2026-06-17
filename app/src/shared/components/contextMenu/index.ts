import type { Directive } from "vue";
import type { MenuGroup } from "@/shared/components/popUpMenu/type";
import { openContextMenu } from "@/shared/state/contextMenuState";

export interface ContextMenuPayload<T = any> {
  menu: MenuGroup<T>[];
  context?: T;
}

interface ContextMenuElement extends HTMLElement {
  _contextMenuHandler?: (e: MouseEvent) => void;
}

export const vContextMenu: Directive<ContextMenuElement, ContextMenuPayload> = {
  mounted(el, binding) {
    el._contextMenuHandler = (e: MouseEvent) => {
      openContextMenu(e, binding.value.menu, binding.value.context);
    };
    el.addEventListener("contextmenu", el._contextMenuHandler);
  },

  updated(el, binding) {
    if (el._contextMenuHandler) {
      el.removeEventListener("contextmenu", el._contextMenuHandler);
    }
    el._contextMenuHandler = (e: MouseEvent) => {
      openContextMenu(e, binding.value.menu, binding.value.context);
    };
    el.addEventListener("contextmenu", el._contextMenuHandler);
  },

  unmounted(el) {
    if (el._contextMenuHandler) {
      el.removeEventListener("contextmenu", el._contextMenuHandler);
      delete el._contextMenuHandler;
    }
  },
};
