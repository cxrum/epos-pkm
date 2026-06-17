<script setup lang="ts">
import { computed, ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import { flip, shift, offset, useFloating } from "@floating-ui/vue";
import {
  contextMenuContext,
  isContextMenuOpen,
  contextMenuPosition,
  currentMenuData,
  closeContextMenu,
} from "@/shared/state/contextMenuState.ts";
import PopUpMenu from "../popUpMenu/PopUpMenu.vue";

const menuRef = ref<HTMLElement | null>(null);

const virtualReference = computed(() => ({
  getBoundingClientRect() {
    return {
      width: 0,
      height: 0,
      x: contextMenuPosition.x,
      y: contextMenuPosition.y,
      top: contextMenuPosition.y,
      left: contextMenuPosition.x,
      right: contextMenuPosition.x,
      bottom: contextMenuPosition.y,
    };
  },
}));

const { floatingStyles } = useFloating(virtualReference, menuRef, {
  placement: "bottom-start",
  middleware: [offset(4), flip(), shift()],
  open: isContextMenuOpen,
});

onClickOutside(menuRef, closeContextMenu);
window.addEventListener("scroll", closeContextMenu, { passive: true });
</script>

<template>
  <transition name="fade">
    <div
      v-if="isContextMenuOpen && currentMenuData"
      ref="menuRef"
      :style="floatingStyles"
      class="fixed z-9999"
    >
      <pop-up-menu
        :context-data="contextMenuContext"
        :groups="currentMenuData"
        @close="closeContextMenu"
      />
    </div>
  </transition>
</template>
