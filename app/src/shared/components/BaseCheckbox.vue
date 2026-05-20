<script setup lang="ts">
import { computed } from 'vue';


const model = defineModel<boolean | any[]>()

const props = defineProps({
  value: {
    type: [String, Number, Object],
    default: null
  },
  label: {
    type: String,
    default: ''
  },
  checkIcon:{
    type: Boolean,
    default: true
  }
})

defineOptions({
  inheritAttrs: false
})

const computedClass = computed(()=>{
    const gap = props.checkIcon ? 'gap-2' : ''
    return `${gap}`
})

</script>

<template>
  <label 
    class="flex items-center cursor-pointer peer-checked:bg-(--hover) px-1 w-fit text-(--text-secondary-color) rounded-md transition-colors"
    :class="computedClass"
  >
    <input
      type="checkbox"
      v-model="model"
      :value="value"
      v-bind="$attrs"
      class="pear checkmark"
      :class="checkIcon ? '': 'sr-only'"
    />

    <span 
      v-if="label || $slots.default" 
      class="transition-colors"
    >
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style lang="css" scoped>
.checkmark {
  height: 20px;
  width: 20px;
}
label:has(input:checked) {
  background-color: var(--hover);
}
</style>