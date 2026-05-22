<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Chevron from '@/assets/icons/Chevron.vue'

interface Option {
  label: string
  value: string | number
}

const props = defineProps<{
  modelValue: string | number | null
  options: Option[]
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])

const uniqueId = Math.random().toString(36).substring(2, 9)
const buttonId = `select-button-${uniqueId}`
const listboxId = `select-listbox-${uniqueId}`

const isOpen = ref(false)
const highlightedIndex = ref(-1)

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : (props.placeholder || 'Select value')
})

const selectOption = (value: string | number) => {
  emit('update:modelValue', value)
  isOpen.value = false
}

const closeDropdown = () => {
  isOpen.value = false
  highlightedIndex.value = -1
}

watch(isOpen, (newVal) => {
  if (newVal) {
    const index = props.options.findIndex(opt => opt.value === props.modelValue)
    highlightedIndex.value = index >= 0 ? index : 0
  }
})

const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) {
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()
      isOpen.value = true
    }
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (highlightedIndex.value < props.options.length - 1) {
        highlightedIndex.value++
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (highlightedIndex.value > 0) {
        highlightedIndex.value--
      }
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        selectOption(props.options[highlightedIndex.value].value)
      }
      break
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
    case 'Tab':
      closeDropdown()
      break
  }
}

</script>

<template>
  <div class="relative w-fit font-inherit text-inherit" v-click-outside="closeDropdown">
    
    <button
        :id="buttonId"
        type="button"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-controls="listboxId"
        aria-haspopup="listbox"
        @click="isOpen = !isOpen"
        @keydown="handleKeydown"
        class="flex items-center justify-between gap-4 appearance-none border border-solid border-(--border) min-w-[8em] max-w-[16em] min-h-[2em] px-2 py-[0.2rem] text-(--text-default-color) transition-colors duration-200"
        :class="[
            isOpen ? 'rounded-t-md' : 'rounded-md'
        ]"
    
      >
      <span class="truncate">{{ selectedLabel }}</span>
      
      <Chevron 
        class="w-5 h-5 w-min-5 h-min-5 transition-transform duration-200 shrink-0" 
        :class="{ 'rotate-180': isOpen }"
        />

    </button>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <ul
        v-show="isOpen"
        :id="listboxId"
        class="absolute z-50 w-full border border-t-0 border-solid border-(--border) rounded-b-md bg-(--bg-bottom-layer) overflow-hidden m-0 list-none"
        :aria-labelledby="buttonId"
        tabindex="-1"
        >
        <li
          v-for="(option, index) in options"
          :key="option.value"
          @click="selectOption(option.value)"
          @mouseenter="highlightedIndex = index"
          class="px-2 py-[0.2rem] cursor-pointer rounded-md text-(--text-default-color) transition-colors hover:bg-(--option-hover) truncate"
          :class="[
            modelValue === option.value ? 'bg-(--accent) text-(--text-on-accent-color)' : '',
            highlightedIndex === index && modelValue !== option.value ? 'border border-solid border-(--border) bg-(--option-hover)' : ''
          ]"
          :id="`option-${uniqueId}-${index}`"
        >
          {{ option.label }}
        </li>
      </ul>
    </transition>
  </div>
</template>