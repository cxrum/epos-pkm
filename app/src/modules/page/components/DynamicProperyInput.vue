<script setup lang="ts">
import type { Icon } from "@/core/types";
import AutoCompleteInput from "@/shared/components/AutoCompleteInput.vue";
import BaseCheckbox from "@/shared/components/BaseCheckbox.vue";
import BaseInput from "@/shared/components/BaseInput.vue";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";

const model = defineModel<any>();
const searchQuery = defineModel<string>("searchQuery", { default: "" });

const props = defineProps<{
  propertyScheme: {
    id: string;
    type: string;
    isChangeable: boolean;
    isSystem: boolean;
    icon?: Icon;
    [key: string]: any;
  };
  errMsg?: string;
  autocompleteItems?: any[];
}>();

const emit = defineEmits<{
  (e: "focusChange", isFocused: boolean): void;
}>();

const resolveInputFieldType = (type: string) => {
  return type === "number" ? "number" : "text";
};
</script>

<template>
  <span class="flex flex-1 items-center">
    <BaseIcon>
      <DynamicIcon :icon="propertyScheme.icon" />
    </BaseIcon>

    <p class="flex pe-4 w-1/2 w-max-1/2 truncate">
      {{ propertyScheme.title }}
    </p>

    <BaseInput
      v-if="['text', 'number'].includes(propertyScheme.type)"
      v-model="model"
      class="w-full"
      :err-msg="errMsg"
      :type="resolveInputFieldType(propertyScheme.type)"
      @focus="emit('focusChange', true)"
      @blur="emit('focusChange', false)"
    />

    <AutoCompleteInput
      v-else-if="['autocomplete'].includes(propertyScheme.type)"
      v-model="model"
      v-model:searchQuery="searchQuery"
      :items="autocompleteItems || []"
      class="w-full"
      :err-msg="errMsg"
      @focus="emit('focusChange', true)"
      @blur="emit('focusChange', false)"
    />

    <BaseCheckbox
      v-else-if="['boolean'].includes(propertyScheme.type)"
      v-model="model"
      :items="autocompleteItems || []"
      :err-msg="errMsg"
      @focus="emit('focusChange', true)"
      @blur="emit('focusChange', false)"
    />

    <template v-if="propertyScheme.isSystem && !propertyScheme.isChangeable">
      <BaseIcon class="opacity-50" title="System property">
        <DynamicIcon :icon="{ type: 'default', name: 'lock' }" />
      </BaseIcon>
    </template>
  </span>
</template>
