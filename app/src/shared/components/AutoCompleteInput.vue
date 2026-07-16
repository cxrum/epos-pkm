<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { AutoCompleteItem } from "./types.ts";

const inputRef = ref<HTMLInputElement | null>(null);
const model = defineModel<string>();
const searchQuery = defineModel<string>("searchQuery", { default: "" });

const props = withDefaults(
  defineProps<{
    label?: string | null;
    errMsg?: string | null;
    items?: AutoCompleteItem[];
  }>(),
  {
    label: null,
    errMsg: null,
    items: () => [],
  },
);

const emit = defineEmits<{
  (e: "select", item: AutoCompleteItem): void;
}>();

const isOpen = ref(false);

watch(
  () => model.value,
  (newId) => {
    const selectedItem = props.items.find((i) => i.id === newId);
    if (selectedItem) {
      searchQuery.value = selectedItem.label;
    } else if (!newId) {
      searchQuery.value = "";
    }
  },
  { immediate: true },
);

watch(
  () => props.items,
  () => {
    if (!isOpen) {
      const selectedItem = props.items.find((i) => i.id === model.value);
      if (selectedItem && searchQuery.value !== selectedItem.label) {
        searchQuery.value = selectedItem.label;
      }
    }
  },
  { deep: true },
);

defineExpose({
  focus: () => inputRef.value?.focus(),
});

defineOptions({
  inheritAttrs: false,
});

const handleWrapperClick = () => {
  inputRef.value?.focus();
};

const handleInput = () => {
  if (model.value) {
    const selectedItem = props.items.find((i) => i.id === model.value);
    if (selectedItem && selectedItem.label !== searchQuery.value) {
      model.value = undefined;
    }
  }
};

const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items;

  const selectedItem = props.items.find((i) => i.id === model.value);
  if (selectedItem && selectedItem.label === searchQuery.value) {
    return props.items;
  }

  const search = searchQuery.value.toLowerCase();
  return props.items.filter((item) => {
    return item.label && item.label.toLowerCase().includes(search);
  });
});

const handleSelect = (item: AutoCompleteItem) => {
  searchQuery.value = item.label;
  model.value = item.id;
  isOpen.value = false;
  emit("select", item);
};

const handleBlur = () => {
  setTimeout(() => {
    isOpen.value = false;
    if (!model.value) {
      searchQuery.value = "";
    } else {
      const selectedItem = props.items.find((i) => i.id === model.value);
      if (selectedItem) {
        searchQuery.value = selectedItem.label;
      }
    }
  }, 150);
};
</script>
<template>
  <div class="w-fit flex flex-col relative">
    <span v-if="label">
      {{ label }}
    </span>

    <div class="base-input" @click="handleWrapperClick">
      <slot name="prefix"></slot>

      <input
        ref="inputRef"
        v-model="searchQuery"
        v-bind="$attrs"
        @input="handleInput"
        @focus="isOpen = true"
        @blur="handleBlur"
      />

      <slot name="suffix"></slot>

      <slot></slot>
    </div>

    <div
      v-if="isOpen && filteredItems.length > 0"
      class="surface-dialog scroll absolute top-full left-0 mt-1 w-full z-50 flex flex-col max-h-48 overflow-y-auto gap-1"
    >
      <button
        v-for="item in filteredItems"
        :key="item.id"
        class="base-button h-auto min-h-10 w-full max-w-full py-1.5 px-2"
        @click.prevent="handleSelect(item)"
      >
        <span class="flex flex-col w-full min-w-0 text-left justify-center">
          <p class="w-full truncate block leading-tight">
            {{ item.label ?? item.text }}
          </p>
          <label
            v-if="item.description"
            class="w-full truncate block opacity-70 text-xs mt-0.5 cursor-pointer"
          >
            {{ item.description }}
          </label>
        </span>
      </button>
    </div>

    <label v-if="errMsg" class="text-(--text-error-color)">
      {{ errMsg }}
    </label>
  </div>
</template>
