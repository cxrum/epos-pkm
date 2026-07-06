<script setup lang="ts" generic="_TId = string | number | boolean">
const model = defineModel<_TId>();

interface BaseRadioOption {
  id: _TId;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    options: BaseRadioOption[];
    label?: string | null;
    errMsg?: string | null;
    name?: string;
  }>(),
  {
    label: null,
    errMsg: null,
    name: undefined,
  },
);

defineOptions({
  inheritAttrs: false,
});

const groupName =
  props.name ?? `radio-group-${Math.random().toString(36).slice(2, 9)}`;
</script>

<template>
  <div class="base-radio-group">
    <label v-if="label">
      {{ label }}
    </label>

    <div class="flex">
      <label
        v-for="option in options"
        :key="String(option.id)"
        class="base-radio-group-option clickable flex items-center rounded-md px-3 py-2 transition-colors"
        :class="{
          'is-active': model === option.id,
          'opacity-60': option.disabled,
        }"
      >
        <div class="flex items-center gap-2">
          <input
            v-model="model"
            type="radio"
            :name="groupName"
            :value="option.id"
            :disabled="option.disabled"
            class="h-4 w-4"
          />
          <span>
            {{ option.label }}
          </span>
        </div>
      </label>
    </div>

    <label v-if="errMsg" class="text-(--text-error-color)">
      {{ errMsg }}
    </label>
  </div>
</template>

<style scoped>
.base-radio-group-option.is-active {
  background-color: var(--hover);
}

@media screen and (max-width: 760px) {
  .base-radio-group {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 0.5rem;
  }
}

@media screen and (min-width: 760px) {
  .base-radio-group {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>
