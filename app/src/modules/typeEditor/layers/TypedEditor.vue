<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import {
  useTypeEditorStore,
  type PropertyEntry,
  type TypeTreeNodes,
} from "../store/typeEditorStore";
import type { EpPropertyTypes, EpTypeId, Icon, Path } from "@/core/types";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";
import BaseSelect from "@/shared/components/BaseSelect.vue";
import type { MenuGroup } from "@/shared/components/popUpMenu/type";
import { useWorkspaceStore } from "@/core/store/workspaceStore";
import DocumentIcon from "@/assets/icons/DocumentIcon.vue";
import Breadcrumbs from "@/core/components/Breadcrumbs.vue";
import TypeIcon from "@/assets/icons/TypeIcon.vue";
import FloatingPopUpMenu from "@/shared/components/popUpMenu/FloatingPopUpMenu.vue";
import DotsMenu from "@/assets/icons/DotsMenu.vue";
import { useGlobalNavigation } from "@/core/store/navigationStore";

const props = defineProps();
const route = useRoute();
const typeEditorStore = useTypeEditorStore();
const workSpaceStore = useWorkspaceStore();
const globalNavigationStore = useGlobalNavigation();

const propertyTypesMenu = [
  { label: "Boolean", value: "boolean" },
  { label: "Select", value: "select" },
  { label: "Number", value: "number" },
  { label: "Text", value: "string" },
];

watch(
  () => route.params.id,
  (id) => {
    if (id) {
      typeEditorStore.loadType(id as EpTypeId);
    }
  },
  { immediate: true },
);

const handleTypeChange = (
  propertyId: string,
  newValue: string | number | null,
) => {
  if (newValue) {
    typeEditorStore.updatePropertyType(propertyId, newValue as EpPropertyTypes);
  }
};

const pageMenuData: MenuGroup[] = [
  {
    title: "Page",
    items: [
      { type: "button", label: "Wtf", icon: DocumentIcon },
      { type: "divider" },
      { type: "button", label: "Wtf", icon: DocumentIcon },
    ],
  },
];

const isTypeEditorOpen = computed(() => workSpaceStore.isTypeEditorOpen);

const computedPath = computed(() => {
  return typeEditorStore.breadCrumbs;
});

const groupedProperties = computed(
  (): { id: string; title: string; icon?: Icon; items: PropertyEntry[] }[] => {
    const filteredProps = typeEditorStore.properties;
    const groups = new Map();

    filteredProps.forEach((prop) => {
      const groupId = prop.parentType?.id || "current";
      const groupTitle = prop.parentType?.title || "This";

      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          title: groupTitle,
          items: [],
          icon: prop.parentType?.icon,
        });
      }

      groups.get(groupId).items.push(prop);
    });

    return Array.from(groups.values());
  },
);

const currentProperties = computed(() => {
  return groupedProperties.value.find((it) => it.id === "current");
});

const inheritedProperties = computed(() => {
  return groupedProperties.value.filter((it) => it.id !== "current");
});

const handleOnChainClick = (value: Path) => {
  globalNavigationStore.openType(value.id);
};
</script>

<template>
  <nav class="flex w-full flex-col shrink-0 bg-(--bg-canvas) p-1">
    <div class="flex w-full shrink-0 items-center">
      <Breadcrumbs :path="computedPath" @chain-click="handleOnChainClick" />

      <BaseIcon
        size="28px"
        interactive
        @click="workSpaceStore.toggleTypeEditor()"
        class="text-(--icon-color) shrink-0"
        :class="isTypeEditorOpen ? 'bg-(--hover)' : ''"
      >
        <TypeIcon />
      </BaseIcon>

      <FloatingPopUpMenu :menu-data="pageMenuData" placement="bottom-end">
        <template #trigger="{ referenceRef, toggleMenu }">
          <BaseIcon
            :ref="referenceRef"
            size="28px"
            interactive
            class="text-(--icon-color)"
            @click="toggleMenu"
          >
            <DotsMenu />
          </BaseIcon>
        </template>
      </FloatingPopUpMenu>
    </div>
  </nav>

  <div v-if="!typeEditorStore.type"></div>
  <div v-else class="page">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <span class="flex flex-row gap-1 items-center">
          <BaseIcon size="32px">
            <DynamicIcon :icon="typeEditorStore.type.icon" />
          </BaseIcon>
          <h1>
            {{ typeEditorStore.type.title }}
          </h1>
        </span>

        <div class="flex flex-col gap-2">
          <div
            v-if="currentProperties && currentProperties.items.length > 0"
            class="flex flex-col"
          >
            <span
              v-for="entry in currentProperties.items"
              class="flex flex-row items-center"
            >
              <BaseIcon size="24px">
                <DynamicIcon :icon="entry.icon" class="text-(--icon-color)" />
              </BaseIcon>
              <p class="flex flex-1">
                {{ entry.title }}
              </p>
              <BaseSelect
                :disabled="entry.isSystem"
                :options="propertyTypesMenu"
                :model-value="entry.type"
                @update:model-value="handleTypeChange(entry.id, $event)"
              />
            </span>
          </div>
          <div
            v-for="group in inheritedProperties"
            :key="group.id"
            class="flex flex-col"
          >
            <span class="flex flex-row">
              <BaseIcon size="24px">
                <DynamicIcon :icon="group.icon" class="text-(--icon-color)" />
              </BaseIcon>
              <p class="text-(--text-secondary-color)">{{ group.title }}:</p>
            </span>

            <span
              v-for="entry in group.items"
              :key="entry.id"
              :id="entry.id"
              class="flex flex-row items-center gap-2"
            >
              <BaseIcon size="24px">
                <DynamicIcon :icon="entry.icon" class="text-(--icon-color)" />
              </BaseIcon>

              <p class="">
                {{ entry.title }}
              </p>

              <BaseIcon
                size="24px"
                class="opacity-50"
                v-if="entry.isSystem"
                title="System property"
              >
                <DynamicIcon :icon="{ type: 'default', name: 'lock' }" />
              </BaseIcon>

              <div class="flex flex-1 m-0"></div>

              <BaseSelect
                :disabled="entry.isSystem"
                :options="propertyTypesMenu"
                :model-value="entry.type"
                @update:model-value="handleTypeChange(entry.id, $event)"
              />
            </span>
          </div>
        </div>
      </div>
      <div class="hl mb-4"></div>
      <div class="stub"></div>
      <div class="stub"></div>
      <div class="stub"></div>
      <div class="stub"></div>
      <div class="stub w-1/2"></div>
    </div>
  </div>
</template>

<style lang="scss">
.stub {
  height: 8px;
  background: var(--border);
}

.page {
  padding-left: clamp(16px, 8vw, 128px);
  padding-right: clamp(16px, 8vw, 128px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.custom-drag-handle {
  &::after {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    content: "⠿";
    cursor: grab;
    font-weight: 700;
    color: var(--icon-color);
  }
  &:hover {
    background: var(--hover);
    border-radius: 0.5rem;
  }
}
</style>
