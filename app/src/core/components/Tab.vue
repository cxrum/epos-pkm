<script setup lang="ts">
import { computed } from 'vue'
import Cross from '../../assets/icons/Cross.vue'
import BaseIcon from './BaseIcon.vue'

interface TabProps {
    active?: boolean;
    icon?: object | Function | null;
    id?: number;
}

const props = withDefaults(defineProps<TabProps>(), {
    active: false,
    icon: null,
    id: -1
})

const emit = defineEmits<{
  (e: 'tab-click', tabId: Number): void
  (e: 'close', tabId: Number): void
}>()

const computedClasses = computed(() => {
  const baseClasses = 'flex w-[10em] h-[2em] shrink-0 px-2 gap-2 items-center rounded-md transition-colors'
  
  const activeClasses = props.active 
    ? 'bg-(--tab-active-bg) text-(--text-color)' 
    : 'text-(--text-secondary-color) cursor-pointer'

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
    
    <component 
        :is="icon" 
        v-if="icon" 
        class="w-5 h-5 shrink-0 text-(--icon-color)"
    />
    
    <span class="truncate flex-1 text-left">
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