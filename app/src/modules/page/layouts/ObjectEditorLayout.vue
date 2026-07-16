<script setup lang="ts">
import {
  computed,
  h,
  inject,
  reactive,
  ref,
  watch,
  type Ref,
  type WritableComputedRef,
} from "vue";
import Accordion from "@/shared/components/Accordion.vue";
import type { EpObjectId, EpPropertyId, EpTypeId, Icon } from "@/core/types";
import type { ValuedPropertyEntry } from "@/core/application/type";
import { useObjectEditorStore } from "../store/objectEditorStore";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";
import {
  EditorControllerKey,
  type EditorControllerContract,
} from "../components/editor/contract";
import DynamicProperyInput from "../components/DynamicProperyInput.vue";

const objectEditorStore = useObjectEditorStore();
const controller = inject(EditorControllerKey);

const props = defineProps<{
  controller: EditorControllerContract;
}>();

const searchQueries = ref<Record<string, string>>({});
const autocompleteOptions = ref<Record<string, any[]>>({});

const selectedType = ref<EpTypeId>();
const typeOptions: Ref<{ label: string; value: EpTypeId }[]> = ref([]);

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
      if (prop.propertyScheme.parentType?.id !== "sys:root") {
        if (!groups.has(groupId)) {
          groups.set(groupId, {
            id: groupId,
            title: groupTitle,
            items: [],
            icon: prop.propertyScheme.parentType?.icon,
          });
        }

        groups.get(groupId).items.push(prop);
      }
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
  const focusedObject = objectEditorStore.focusedObject;
  if (!focusedObject) return;
  if (val === "" || val === null) {
    return;
  }

  props.controller.updateDraftObjectProperty(focusedObject.id, propId, val);
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

const updateAutocompleteValue = (val: EpObjectId, propId: EpPropertyId) => {
  const focusedObject = objectEditorStore.focusedObject;
  if (!focusedObject) return;
  if (val === "" || val === null) {
    return;
  }

  props.controller.updateDraftObjectProperty(focusedObject.id, propId, val);
};

const fetchAutocompleteOptions = async (scheme: any, query: string) => {
  const result = await objectEditorStore.getFilteredObjects(scheme, query);
  autocompleteOptions.value[scheme.id] = result;
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

    case "autocomplete":
      return computed({
        get: () => {
          const scheme =
            objectEditorStore.valuedProperties?.props.get(propId)?.value;
          return scheme?.value;
        },
        set: (val: string) => {
          updateAutocompleteValue(val, propId);
        },
      });

    default:
      console.warn(`[Warning] Немає обробника для типу: ${type}`);
      return undefined;
  }
};

const togleFieldFocus = (state: boolean) => {
  if (controller) {
    controller.setFocusLock(state);
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
          const handler = createPropertyHandler(id, prop.propertyScheme.type);
          if (handler) {
            fetchAutocompleteOptions(prop.propertyScheme, "");

            handlers.set(id, handler);
          }
        }
      }
    });
  },
  { immediate: true, deep: false },
);
watch(
  () => objectEditorStore.selectedType,
  (type) => {
    if (type) {
      selectedType.value = type.id;
    }
  },
);
watch(
  () => objectEditorStore.availableTypes,
  (types) => {
    if (types) {
      typeOptions.value = types.map((it) => {
        return {
          label: it.title,
          value: it.id,
        };
      });
    }
  },
);
</script>
<template>
  <div class="flex flex-col h-full w-full">
    <h5 class="mb-4">Editing object</h5>

    <div class="w-full border-b border-(--border) mb-4"></div>

    <Accordion :label="'Properties'">
      <template v-if="groupedProperties.length > 0">
        <div class="flex flex-col gap-2">
          <div
            v-for="entry of currentProperties?.items"
            :key="entry.propertyScheme.id"
            :id="entry.propertyScheme.id"
            class="w-full"
          >
            <DynamicProperyInput
              v-if="handlers.has(entry.propertyScheme.id)"
              v-model="handlers.get(entry.propertyScheme.id)!.value"
              v-model:searchQuery="searchQueries[entry.propertyScheme.id]"
              :property-scheme="entry.propertyScheme"
              :autocomplete-items="autocompleteOptions[entry.propertyScheme.id]"
              :err-msg="
                objectEditorStore.propertyFieldError.get(
                  entry.propertyScheme.id,
                )
              "
              @update:searchQuery="
                fetchAutocompleteOptions(entry.propertyScheme, $event)
              "
              @focus-change="togleFieldFocus"
              class="ps-2"
            />
          </div>
        </div>

        <template v-if="inheritedProperties.length > 0">
          <div class="w-full border-b border-(--border) my-4"></div>

          <h5 class="mb-4">Inherited</h5>

          <div
            v-for="group of inheritedProperties"
            :key="group.id"
            class="flex flex-col gap-4 mb-4"
          >
            <div class="flex flex-col gap-2">
              <div
                class="flex flex-row items-center gap-2 text-(--text-secondary-color)"
              >
                <BaseIcon>
                  <DynamicIcon :icon="group.icon" />
                </BaseIcon>
                <span class="font-medium">{{ group.title }}</span>
              </div>

              <div class="flex flex-col gap-2">
                <div
                  v-for="entry in group.items"
                  :key="entry.propertyScheme.id"
                  :id="entry.propertyScheme.id"
                  class="w-full"
                >
                  <DynamicProperyInput
                    v-if="handlers.has(entry.propertyScheme.id)"
                    v-model="handlers.get(entry.propertyScheme.id)!.value"
                    v-model:searchQuery="searchQueries[entry.propertyScheme.id]"
                    :property-scheme="entry.propertyScheme"
                    :autocomplete-items="
                      autocompleteOptions[entry.propertyScheme.id]
                    "
                    :err-msg="
                      objectEditorStore.propertyFieldError.get(
                        entry.propertyScheme.id,
                      )
                    "
                    @update:searchQuery="
                      fetchAutocompleteOptions(entry.propertyScheme, $event)
                    "
                    @focus-change="togleFieldFocus"
                    class="ps-2"
                  />
                </div>
              </div>
            </div>

            <div class="w-full border-b border-(--border)"></div>
          </div>
        </template>
      </template>
      <template v-else>
        <p
          class="flex w-full p-8 items-center justify-center text-center text-(--text-secondary-color)"
        >
          Select object with properties in the editor
        </p>
      </template>
    </Accordion>
  </div>
</template>
