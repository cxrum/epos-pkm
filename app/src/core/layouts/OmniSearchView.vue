<script setup lang="ts">
import { ref } from "vue";
import Search from "@/assets/icons/Search.vue";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import Regex from "@/assets/icons/Regex.vue";
import BaseCheckbox from "@/shared/components/BaseCheckbox.vue";
import SortAlt from "@/assets/icons/SortAlt.vue";
import BarsFilter from "@/assets/icons/BarsFilter.vue";
import { offset, useFloating } from "@floating-ui/vue";
import PopUpMenu from "@/shared/components/popUpMenu/PopUpMenu.vue";
import type { MenuGroup } from "@/shared/components/popUpMenu/type";
import DocumentIcon from "@/assets/icons/DocumentIcon.vue";

const selectedMenu = ref("all");
const isRegexChecked = ref(false);

const isFilterOptionsOpened = ref(false);
const isSortOptionsOpened = ref(false);

const toggleFilterOptions = () => {
  isSortOptionsOpened.value = false;
  isFilterOptionsOpened.value = !isFilterOptionsOpened.value;
};

const toggleSortOptions = () => {
  isFilterOptionsOpened.value = false;
  isSortOptionsOpened.value = !isSortOptionsOpened.value;
};

const filterOptionsButtonRef = ref<HTMLElement | null>(null);
const filterOptionsRef = ref<HTMLElement | null>(null);
const { floatingStyles: filterOptionsStyles } = useFloating(
  filterOptionsButtonRef,
  filterOptionsRef,
  {
    placement: "bottom-end",
    middleware: [offset(8)],
    open: isFilterOptionsOpened,
  },
);

const sortOptionsButtonRef = ref<HTMLElement | null>(null);
const sortOptionsRef = ref<HTMLElement | null>(null);
const { floatingStyles: sortOptionsStyles } = useFloating(
  sortOptionsButtonRef,
  sortOptionsRef,
  {
    placement: "bottom-end",
    middleware: [offset(8)],
    open: isSortOptionsOpened,
  },
);

const types = [
  { id: "all", label: "All" },
  { id: "pages", label: "Pages" },
  { id: "types", label: "Types" },
  { id: "text", label: "Text" },
];

const filterOptionsData: MenuGroup[] = [
  {
    title: "Account",
    items: [
      { type: "button", label: "Profile", icon: DocumentIcon },
      { type: "divider" },
      { type: "button", label: "Settings", icon: DocumentIcon },
    ],
  },
];

const sorterOptionsData: MenuGroup[] = [
  {
    title: "Account",
    items: [
      { type: "button", label: "Profile", icon: DocumentIcon },
      { type: "divider" },
      { type: "button", label: "Settings", icon: DocumentIcon },
    ],
  },
];
</script>

<template>
  <div
    class="flex flex-col w-1/2 h-1/4 ьшт bg-(--bg-omnisearh) rounded-md border border-(--border) items-center shadow-md"
  >
    <div
      class="flex justify-start items-center w-full p-2 gap-2 border-b border-(--border)"
    >
      <div class="flex flex-1">
        <label
          v-for="plan in types"
          :key="plan.id"
          class="flex items-center py-2 px-3 rounded-md cursor-pointer clickable transition-colors"
          :class="selectedMenu === plan.id ? 'bg-(--tab-active-bg)' : ''"
        >
          <div class="flex items-center">
            <input
              type="radio"
              v-model="selectedMenu"
              :value="plan.id"
              class="w-4 h-4"
            />
            <span class="text-(-text-secondary-color)">{{ plan.label }}</span>
          </div>
        </label>
      </div>

      <BaseIcon
        size="24px"
        class="shrink-0"
        interactive
        @click="toggleFilterOptions"
        ref="filterOptionsButtonRef"
      >
        <BarsFilter />
      </BaseIcon>

      <PopUpMenu
        :style="filterOptionsStyles"
        ref="filterOptionsRef"
        :groups="filterOptionsData"
        v-if="isFilterOptionsOpened"
      >
      </PopUpMenu>

      <BaseIcon
        size="24px"
        class="shrink-0"
        ref="sortOptionsButtonRef"
        interactive
        @click="toggleSortOptions"
      >
        <SortAlt />
      </BaseIcon>

      <PopUpMenu
        :style="sortOptionsStyles"
        ref="sortOptionsRef"
        :groups="sorterOptionsData"
        v-if="isSortOptionsOpened"
      >
      </PopUpMenu>
    </div>

    <div class="flex flex-row w-full p-2 border-b border-(--border)">
      <BaseIcon class="shrink-0">
        <Search />
      </BaseIcon>

      <input
        class="flex-1 px-2 bg-transparent outline-none text-(--text-default-color) transition-colors"
        placeholder="Search everything..."
      />

      <BaseCheckbox v-model="isRegexChecked" :check-icon="false">
        <BaseIcon class="shrink-0">
          <Regex />
        </BaseIcon>
      </BaseCheckbox>
    </div>
    <div class="flex flex-1 w-full flex-col p-2 overflow-auto auto-hide-scroll">
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
      <p>Sample snippet</p>
    </div>
  </div>
</template>

<style lang="css" scoped>
input[type="radio"] {
  visibility: hidden;
  height: 0;
  width: 0;
}
label:hover {
  background-color: var(--hover);
}
</style>
