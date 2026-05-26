<script setup lang="ts">
import { computed, ref } from 'vue'
import Tab from '@/core/components/Tab.vue';
import { useGlobalTabStore } from '@/core/store/browserTabsStore';
import DynamicIcon from '@/shared/components/icon/DynamicIcon.vue';

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
      :active="activePageId===page.id"
      @close="onClosePageClick"
      @tab-click="onTabClick"
      >
      <template #icon>
        <DynamicIcon :icon="page.type?.icon" class="w-5 h-5 shrink-0 text-(--icon-color)" />
      </template>
      
      {{ page.title }}
    </Tab>

</div>
</template>