<script setup lang="ts">
import { watch } from "vue";
import { useRoute } from "vue-router";
import { useTypeEditorStore } from "../store/typeEditorStore";
import type { EpPropertyTypes, EpTypeId } from "@/core/types";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";
import BaseSelect from "@/shared/components/BaseSelect.vue";

const props = defineProps();
const route = useRoute();
const typeEditorStore = useTypeEditorStore();

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
</script>

<template>
  <div v-if="!typeEditorStore.type"></div>
  <div v-else class="page">
    <div class="flex flex-col gap-4">
      <span class="flex flex-row gap-2 items-center">
        <BaseIcon size="32px">
          <DynamicIcon :icon="typeEditorStore.type.icon" />
        </BaseIcon>
        <h1>
          {{ typeEditorStore.type.title }}
        </h1>
      </span>

      <div class="flex flex-col gap-1.5">
        <div
          v-if="typeEditorStore.isSystemPropertiesVisible"
          class="flex flex-col gap-2"
        >
          <label>System properties:</label>
          <span
            v-for="entry in typeEditorStore.properties.filter(
              (it) => it.isSystem,
            )"
            :key="entry.id"
            :id="entry.id"
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
          class="flex flex-col gap-2"
          v-if="
            typeEditorStore.properties.filter((it) => !it.isSystem).length > 0
          "
        >
          <label>Properties:</label>
          <span
            v-for="entry in typeEditorStore.properties.filter(
              (it) => !it.isSystem,
            )"
            :key="entry.id"
            :id="entry.id"
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
      </div>
      <div class="hl"></div>
      <p>
        Example data, example data, example data, example data, example data,
      </p>
    </div>
  </div>
</template>

<style lang="scss">
.hl {
  border-bottom: 1px solid var(--border);
  width: 100%;
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
