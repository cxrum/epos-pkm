<script setup lang="ts">
import { computed, reactive, ref, watch, type WritableComputedRef } from "vue";
import Accordion from "@/shared/components/Accordion.vue";
import BaseInput from "@/shared/components/BaseInput.vue";
import BaseSelect from "@/shared/components/BaseSelect.vue";
import type { EpPropertyId, Icon } from "@/core/types";
import type { ValuedPropertyEntry } from "@/core/application/type";
import { useObjectEditorStore } from "../store/objectEditorStore";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";
import type { EditorControllerContract } from "../components/editor/contract";

const objectEditorStore = useObjectEditorStore();

const props = defineProps<{
  controller: EditorControllerContract;
}>();

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

const updateNumberValue = async (
  val: string | number,
  propId: EpPropertyId,
) => {
  const focusedObject = objectEditorStore.focusedObject;
  if (!focusedObject) return;

  let parsedValue = 1;

  if (val === "" || val === null) {
    return;
  }

  parsedValue = Number(val);

  if (Number.isNaN(parsedValue)) {
    objectEditorStore.setPropertyErrorMsg(propId, "Enter a valid number");
    return;
  }

  props.controller.updateDraftObjectProperty(
    focusedObject.id,
    propId,
    parsedValue,
  );
  objectEditorStore.clearPropertyErrorMsg(propId);
};
const updateBooleanValue = (val: boolean, propId: EpPropertyId) => {
  console.log(`[Boolean] Оновлюємо ${propId}:`, val);
};

const createPropertyHandler = (
  propId: EpPropertyId,
  type: string,
): WritableComputedRef<any> | undefined => {
  switch (type) {
    case "text":
      return computed({
        get: () =>
          objectEditorStore.valuedProperties?.props.get(propId)?.value?.value ??
          "",
        set: (val: string) => updateStringValue(val, propId),
      });

    case "boolean":
      return computed({
        get: () =>
          objectEditorStore.valuedProperties?.props.get(propId)?.value?.value ??
          false,
        set: (val: boolean) => updateBooleanValue(val, propId),
      });

    case "number":
      return computed({
        get: () =>
          objectEditorStore.valuedProperties?.props.get(propId)?.value?.value,
        set: (val: string) => {
          updateNumberValue(val, propId);
        },
      });

    default:
      console.warn(`[Warning] Немає обробника для типу: ${type}`);
      return undefined;
  }
};

watch(
  () => objectEditorStore.valuedProperties,
  (valuedProperties) => {
    if (!valuedProperties) return;

    console.log(valuedProperties);

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
          const handler = createPropertyHandler(id, prop.propertyScheme.type);
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
        class="flex flex-row items-center"
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

        <p class="flex pe-4">
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
          :err-msg="
            objectEditorStore.propertyFieldError.get(entry.propertyScheme.id)
          "
          type="number"
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
          class="flex flex-row items-center"
        >
          <BaseIcon size="24px">
            <DynamicIcon
              :icon="entry.propertyScheme.icon"
              class="text-(--icon-color)"
            />
          </BaseIcon>

          <p class="flex pe-2">
            {{ entry.propertyScheme.title }}
          </p>

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
            {{ entry.value?.value }}
          </p>

          <div class="flex flex-1 m-0"></div>
        </span>
      </div>
    </Accordion>
  </div>
</template>
