<script setup lang="ts" generic="T">
import { ref } from "vue";
import type { ComponentPublicInstance, PropType } from "vue";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type Placement,
} from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import PopUpMenu from "@/shared/components/popUpMenu/PopUpMenu.vue";
import type { MenuGroup } from "./type";

const props = withDefaults(
  defineProps<{
    menuData?: MenuGroup<T>[];
    contextData?: T;
    placement?: Placement;
    offsetValue?: number;
  }>(),
  {
    menuData: () => [],
    placement: "bottom-end",
    offsetValue: 8,
  },
);

const isOpen = ref(false);
const referenceRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);

const resolveElement = (
  value: Element | ComponentPublicInstance | null,
): HTMLElement | null => {
  if (!value) {
    return null;
  }

  if (value instanceof HTMLElement) {
    return value;
  }

  if ("$el" in value && value.$el instanceof HTMLElement) {
    return value.$el;
  }

  return null;
};

const setReferenceRef = (value: Element | ComponentPublicInstance | null) => {
  referenceRef.value = resolveElement(value);
};

const { floatingStyles } = useFloating(referenceRef, floatingRef, {
  placement: () => props.placement,
  strategy: "fixed",
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(props.offsetValue),
    flip({
      fallbackPlacements: ["bottom-end", "top-start", "top-end"],
    }),
    shift({ padding: 8 }),
  ],
  open: isOpen,
});

const openMenu = () => {
  isOpen.value = true;
};

const closeMenu = () => {
  isOpen.value = false;
};

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

onClickOutside(floatingRef, closeMenu, {
  ignore: [referenceRef],
});

defineExpose({
  closeMenu,
  openMenu,
  toggleMenu,
});
</script>

<template>
  <slot
    name="trigger"
    :close-menu="closeMenu"
    :is-open="isOpen"
    :open-menu="openMenu"
    :reference-ref="setReferenceRef"
    :toggle-menu="toggleMenu"
  ></slot>

  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="isOpen"
        ref="floatingRef"
        class="z-50 w-max"
        :style="floatingStyles"
      >
        <PopUpMenu
          :context-data="contextData"
          :groups="menuData"
          @select="closeMenu"
        />
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
