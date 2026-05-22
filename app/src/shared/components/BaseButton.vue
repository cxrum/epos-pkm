<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
    inheritAttrs: false,
})

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value: string) => ['default', 'accent'].includes(value)
  },
  icon: {
    type: [Object, Function],
    default: null
  },
  iconPosition: {
    type: String,
    default: 'left',
    validator: (value: string) => ['left', 'right'].includes(value)
  },
  isContentVisible: {
    type: Boolean,
    default: true
  }
})

const baseClasses = 'inline-flex justify-start items-center h-fit w-fit min-h-[2em] px-[0.5rem] py-[0.2rem] gap-[0.5rem] rounded-md transition-colors'

const variantClasses = {
  default: 'text-(--text-default-color)',
  accent: 'text-(--text-on-accent-color) accent'
}

const computedClasses = computed(() => {
  return `${baseClasses} ${variantClasses[props.variant]}`
})
</script>

<template>
  <button :class="computedClasses" v-bind="$attrs" class="prevent-select" type="button">
    <component 
      :is="icon" 
      v-if="icon && iconPosition === 'left'" 
      class="w-5.5 h-5.5 shrink-0 text-(--icon-color)" 
    />
    
    <span v-show="isContentVisible" class="truncate whitespace-nowrap">
      <slot></slot>
    </span>
    
    <component 
      :is="icon" 
      v-if="icon && iconPosition === 'right'" 
      class="w-5.5 h-5.5 shrink-0 text-(--icon-color)" 
    />
  </button>
</template>