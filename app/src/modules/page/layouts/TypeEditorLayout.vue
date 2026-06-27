<script setup lang="ts">
import {
  computed,
  reactive,
  ref,
  watch,
  type ComputedRef,
  type WritableComputedRef,
} from "vue";
import Accordion from "@/shared/components/Accordion.vue";
import BaseInput from "@/shared/components/BaseInput.vue";
import BaseSelect from "@/shared/components/BaseSelect.vue";
import { usePageEditorStore } from "../store/pageEditorStore";
import { useWorkspaceStore } from "@/core/store/workspaceStore";
import { useGlobalNavigation } from "@/core/store/navigationStore";
import { useGlobalObjectStore } from "@/core/store/globalObjectStore";
import { useBaseEditorController } from "../components/editor/baseEditorController";
import { useGlobalTypeStore } from "@/core/store/globalTypeStore";
import type { EpPropertyId, Icon } from "@/core/types";
import type {
  PropertyEntry,
  ValuedPropertyEntry,
} from "@/core/application/type";
import { useObjectEditorStore } from "../store/objectEditorStore";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";

const pageEditorStore = usePageEditorStore();
const objectEditorStore = useObjectEditorStore();

const workSpaceStore = useWorkspaceStore();
const globalNavigationStore = useGlobalNavigation();
const globalTypeStore = useGlobalTypeStore();

const selectedBasicType = ref(null);
const selectBasicTypeOptions = [
  { label: "Type 1", value: "ab1" },
  { label: "Type 2", value: "ab2" },
  { label: "Type 3", value: "ab3" },
];

const groupedProperties = computed(
  (): {
    id: string;
    title: string;
    icon?: Icon;
    items: ValuedPropertyEntry[];
  }[] => {
    const filteredProps = objectEditorStore.valuedProperties?.props ?? [];
    const groups = new Map();

    filteredProps.forEach((prop) => {
      const groupId = prop.propertyScheme.parentType?.id || "current";
      const groupTitle = prop.propertyScheme.parentType?.title || "This";

      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          title: groupTitle,
          items: [],
          icon: prop.propertyScheme.parentType?.icon,
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

const handlers = reactive(new Map<EpPropertyId, WritableComputedRef<any>>());

const updateStringValue = (val: string, propId: EpPropertyId) => {
  console.log(`[Text] Оновлюємо ${propId}:`, val);
};

const updateNumberValue = (val: string, propId: EpPropertyId) => {
  console.log(`[Text] Оновлюємо ${propId}:`, val);
};

const updateBooleanValue = (val: boolean, propId: EpPropertyId) => {
  console.log(`[Boolean] Оновлюємо ${propId}:`, val);
};

const createPropertyHandler = (
  prop: ValuedPropertyEntry,
): WritableComputedRef<any> | undefined => {
  const scheme = prop.propertyScheme;

  switch (scheme.type) {
    case "text":
      return computed({
        get: () => prop.value?.value,
        set: (val: string) => updateStringValue(val, scheme.id),
      });

    case "boolean":
      return computed({
        get: () => prop.value ?? false,
        set: (val: boolean) => updateBooleanValue(val, scheme.id),
      });
    case "number":
      return computed({
        get: () => prop.value?.value,
        set: (val: string) => updateNumberValue(val, scheme.id),
      });

    default:
      console.warn(`[Warning] Немає обробника для типу: ${scheme.type}`);
      return undefined;
  }
};

watch(
  () => objectEditorStore.valuedProperties,
  (valuedProperties) => {
    if (!valuedProperties) return;

    const currentIds = new Set(valuedProperties.order);
    for (const key of handlers.keys()) {
      if (!currentIds.has(key)) {
        handlers.delete(key);
      }
    }

    valuedProperties.order.forEach((id) => {
      const prop = valuedProperties.props.get(id);

      if (prop && prop.propertyScheme.isChangeable) {
        if (!handlers.has(id)) {
          const handler = createPropertyHandler(prop);
          if (handler) {
            handlers.set(id, handler);
          }
        }
      }
    });

    console.log(valuedProperties);
  },
  { immediate: true, deep: false },
);
</script>

<template>
  <div class="flex flex-col gap-2 h-full">
    <span class="pb-4"> Editing object </span>

    <div
      class="flex flex-row w-full items-center justify-between pb-2 border-b border-(--border)"
    >
      <span class=""> Basic Type </span>

      <BaseSelect
        v-model="selectedBasicType"
        :options="selectBasicTypeOptions"
        class="w-1/2"
      >
      </BaseSelect>
    </div>

    <Accordion :label="'Properties'">
      <span
        v-for="entry of currentProperties?.items"
        :key="entry.propertyScheme.id"
        :id="entry.propertyScheme.id"
        class="flex flex-row items-center gap-2"
      >
        <BaseIcon size="24px">
          <DynamicIcon
            :icon="entry.propertyScheme.icon"
            class="text-(--icon-color)"
          />
        </BaseIcon>

        <BaseIcon
          size="24px"
          class="opacity-50"
          v-if="
            entry.propertyScheme.isSystem && !entry.propertyScheme.isChangeable
          "
          title="System property"
        >
          <DynamicIcon :icon="{ type: 'default', name: 'lock' }" />
        </BaseIcon>

        <p class="flex">
          {{ entry.propertyScheme.title }}
        </p>
        <BaseInput
          v-if="
            entry.propertyScheme.isChangeable &&
            handlers.has(entry.propertyScheme.id) &&
            ['text', 'number'].includes(entry.propertyScheme.type)
          "
          v-model="handlers.get(entry.propertyScheme.id).value"
          class="w-full"
        ></BaseInput>

        <p v-else class="flex">
          {{ entry.value?.value }}
        </p>

        <div class="flex flex-1 m-0"></div>
      </span>

      <div class="hl pt-4"></div>
      <label class="pt-4">Inherited:</label>
      <div
        v-for="group of inheritedProperties"
        :key="group.id"
        class="flex flex-col py-2"
      >
        <span class="flex flex-row">
          <BaseIcon size="24px">
            <DynamicIcon :icon="group.icon" class="text-(--icon-color)" />
          </BaseIcon>
          <p class="text-(--text-secondary-color)">{{ group.title }}:</p>
        </span>

        <span
          v-for="entry in group.items"
          :key="entry.propertyScheme.id"
          :id="entry.propertyScheme.id"
          class="flex flex-row items-center gap-2"
        >
          <BaseIcon size="24px">
            <DynamicIcon
              :icon="entry.propertyScheme.icon"
              class="text-(--icon-color)"
            />
          </BaseIcon>

          <BaseIcon
            size="24px"
            class="opacity-50"
            v-if="
              entry.propertyScheme.isSystem &&
              !entry.propertyScheme.isChangeable
            "
            title="System property"
          >
            <DynamicIcon :icon="{ type: 'default', name: 'lock' }" />
          </BaseIcon>

          <p class="flex">
            {{ entry.propertyScheme.title }}
          </p>

          <p class="flex">
            {{ entry.value?.value }}
          </p>

          <div class="flex flex-1 m-0"></div>
        </span>
      </div>
    </Accordion>
  </div>
</template>
