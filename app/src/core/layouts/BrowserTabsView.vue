<script setup lang="ts">
import Tab from '@/core/components/Tab.vue';
import Document from '@/assets/icons/Document.vue';
import { usePagesStore } from '@/core/store/pagesStore';
import { computed, ref } from 'vue'
import TypeIcon from '@/assets/icons/TypeIcon.vue';
import Table from '@/assets/icons/Table.vue';
import { useWorkSpaceStore } from '@/core/store/workSpaceStore';

const workSpaceStore = useWorkSpaceStore();
const pagesStore = usePagesStore();

const activePageId = computed(()=>{
  return workSpaceStore.activePage
})

const props = defineProps()

const scrollContainer = ref<HTMLElement | null>(null)

const handleHorizontalScroll = (event: WheelEvent) => {
  if (!scrollContainer.value) return

  if (event.deltaY !== 0) {
    event.preventDefault()
    scrollContainer.value.scrollLeft += event.deltaY
  }
}

const computeIcon = (type: string | undefined) => {
  if (type===undefined){
    return Document
  }

  if(type === 'document'){
    return Document
  }else if(type === 'object'){
    return TypeIcon
  }else if(type === 'table'){
    return Table
  }else{
    return Document
  }
} 

const onClosePageClick = (pageId: number) => {
  pagesStore.closePage(pageId)
}

const onTabClick = (pageId: number) => {
  workSpaceStore.setActivePage(pageId)
}

</script>

<template>
<div 
    ref="scrollContainer"
    @wheel="handleHorizontalScroll"
    class="flex w-full h-full items-center mx-auto overflow-x-auto no-scrollbar"
    >
    <Tab 
      v-for="page in pagesStore.loadedPages"
      :id="page.id"
      :icon="computeIcon(page.type)"
      :active="activePageId===page.id"
      @close="onClosePageClick"
      @tab-click="onTabClick"
      >{{ page.title }}
    </Tab>

</div>
</template>