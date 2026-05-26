<script setup lang="ts">
import { computed, type Component } from 'vue'
import Cross from '@/assets/icons/Cross.vue'
import BaseIcon from '@/shared/components/icon/BaseIcon.vue';

const props = defineProps<{
  id: number
  active: boolean
  icon?: Component
}>()

const emit = defineEmits<{
  (e: 'tab-click', tabId: number): void
  (e: 'close', tabId: number): void
}>()

console.log(props.icon)

const computedClasses = computed(() => {
  const baseClasses = 'flex w-[10em] h-[2em] shrink-0 px-2 gap-2 items-center rounded-md transition-colors'
  
  const activeClasses = props.active 
    ? 'bg-(--bg-active-tab)' 
    : 'cursor-pointer'

  return `${baseClasses} ${activeClasses}`
})
</script>

<template>
  <button 
    @click="emit('tab-click', props.id)"
    :class="computedClasses" 
    class="prevent-select tab" 
    type="button"
    >
    
    <slot name="icon">
      <component 
        :is="icon" 
        v-if="icon" 
        class="w-5 h-5 shrink-0 text-(--icon-color)"
      />
    </slot>
    
    <span :class="active ? ' text-(--text-default-color)' : '' " class="truncate flex-1 text-left">
        <slot></slot>
    </span>

    <base-icon
        interactive @click="emit('close', props.id)"
        size="22px"
        class="shrink-0"
        :class="active ? 'text-(--icon-color)':'cross'"
        >
        <Cross />
    </base-icon> 

  </button>
</template>

<style lang="css" scoped>
.tab {
  color: aliceblue;
}

.tab:hover .cross {
  color: var(--icon-color);
}

.cross {
  color: transparent;
}
</style>