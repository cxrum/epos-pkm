import { ref, reactive, shallowRef } from "vue";
import type { MenuGroup } from "@/shared/components/popUpMenu/type";

export const isContextMenuOpen = ref(false);
export const contextMenuContext = ref(undefined);
export const contextMenuPosition = reactive({ x: 0, y: 0 });
export const currentMenuData = shallowRef<MenuGroup[] | null>(null);

export const openContextMenu = (
  event: MouseEvent,
  data: MenuGroup[],
  context?: any,
) => {
  event.preventDefault();
  contextMenuPosition.x = event.clientX;
  contextMenuPosition.y = event.clientY;
  currentMenuData.value = data;
  contextMenuContext.value = context;
  isContextMenuOpen.value = true;
};

export const closeContextMenu = () => {
  isContextMenuOpen.value = false;
  contextMenuContext.value = undefined;
};
