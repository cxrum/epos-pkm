<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
    path: {
        type: Array<String>,
        default: []
    }
})


const scrollContainer = ref<HTMLElement | null>(null)

const handleHorizontalScroll = (event: WheelEvent) => {
  if (!scrollContainer.value) return

  if (event.deltaY !== 0) {
    event.preventDefault()
    scrollContainer.value.scrollLeft += event.deltaY
  }
}

</script>

<template>
    <div
        ref="scrollContainer"
        @wheel="handleHorizontalScroll"
        class="flex h-fit w-full justify-center-safe overflow-x-auto no-scrollbar fade-edges-x"
    >
        <ul class="flex flex-nowrap whitespace-nowrap w-max text-(--text-secondary-color)">
            
            <li 
                v-for="(value, i) in path" 
                :key="i"
                class="after:content-['>'] after:mx-2 last:after:content-none clickable shrink-0 prevent-select"
            >
                <a>
                    {{ value }}
                </a>
            </li>
            
        </ul>
    </div> 
</template>

<style lang="css" scoped>
    li{
        transition: color 0.1s ease;
    }
    li:hover{
        color: color-mix(in oklch, var(--hover) 20%, var(--text-default-color));        
    }
</style>
