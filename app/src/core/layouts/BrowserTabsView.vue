<script setup lang="ts">
import { computed, ref } from 'vue'
import Tab from '@/core/components/Tab.vue';
import Document from '@/assets/icons/Document.vue';
import TypeIcon from '@/assets/icons/TypeIcon.vue';
import Table from '@/assets/icons/Table.vue';
import { useGlobalTabStore } from '@/core/store/browserTabsStore';

const globalTabStore = useGlobalTabStore();

const activePageId = computed(()=>{
  return globalTabStore.activeTab?.id
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
  globalTabStore.closeTab(pageId)
}

const onTabClick = (pageId: number) => {
  globalTabStore.openTab(pageId)
}

</script>

<template>
<div 
    ref="scrollContainer"
    @wheel="handleHorizontalScroll"
    class="flex w-full h-full items-center mx-auto overflow-x-auto no-scrollbar"
    >
    <Tab 
      v-for="page in globalTabStore.openedTabs"
      :id="page.id"
      :icon="computeIcon(page.type)"
      :active="activePageId===page.id"
      @close="onClosePageClick"
      @tab-click="onTabClick"
      >{{ page.title }}
    </Tab>

</div>
</template>