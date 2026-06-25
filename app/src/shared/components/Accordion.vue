<script setup lang="ts">
import { ref } from "vue";
import ChevronRight from "@/assets/icons/Chevron.vue";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import PopUpMenu from "@/shared/components/popUpMenu/PopUpMenu.vue";
import type { MenuGroup } from "@/shared/components/popUpMenu/type";
import DotsMenu from "@/assets/icons/DotsMenu.vue";
import { flip, offset, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
  label: {
    type: String,
    default: "",
  },
  menuData: {
    type: Array<MenuGroup>,
    default: null,
  },
});

const isOpen = ref<boolean>(props.isOpen);
const isPopUpMenuOpen = ref<boolean>(false);

const wrapperRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuButtonRef = ref<HTMLElement | null>(null);

const { floatingStyles } = useFloating(menuButtonRef, menuRef, {
  placement: "bottom-start",
  middleware: [offset(8), flip()],
  open: isPopUpMenuOpen,
});

const onShevronClick = () => {
  isOpen.value = !isOpen.value;
};

const toglePopUpMenu = () => {
  isPopUpMenuOpen.value = !isPopUpMenuOpen.value;
};

onClickOutside(
  menuRef,
  () => {
    isPopUpMenuOpen.value = false;
  },
  { ignore: [menuButtonRef] },
);

defineExpose({
  wrapper: wrapperRef,
  menu: menuRef,
  isPopUpMenuOpen,
});
</script>

<template>
  <div
    ref="wrapperRef"
    :class="isOpen ? 'border-b border-(--border)' : ''"
    class="mt-2"
  >
    <div class="flex flex-row gap-0.5 items-center">
      <base-icon
        size="24px"
        interactive
        @click="onShevronClick"
        class="text-(--icon-color)"
      >
        <ChevronRight :class="isOpen ? '' : '-rotate-90'" />
      </base-icon>

      <span
        class="whitespace-nowrap text-(--text-secondary-color) truncate flex-1 text-left"
      >
        {{ label }}
      </span>
      <base-icon
        size="24px"
        ref="menuButtonRef"
        interactive
        @click="toglePopUpMenu"
        class="text-(--icon-color)"
        v-if="menuData"
      >
        <dots-menu />
      </base-icon>

      <pop-up-menu
        ref="menuRef"
        :groups="menuData"
        :style="floatingStyles"
        v-if="isPopUpMenuOpen"
      />
    </div>

    <div v-show="isOpen" class="flex flex-col py-2 whitespace-nowrap">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="css" scoped>
.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-15px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
