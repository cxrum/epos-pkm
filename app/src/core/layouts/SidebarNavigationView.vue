<script setup lang="ts">
import BaseButton from '@/shared/components/BaseButton.vue';
import Search from '@/assets/icons/Search.vue';
import TypeDicitionary from '@/assets/icons/TypeDicitionary.vue';
import Graph from '@/assets/icons/Graph.vue';
import Accordion from '@/shared/components/Accordion.vue'
import type { MenuGroup } from '@/shared/components/popUpMenu/type';
import Document from '@/assets/icons/Document.vue';
import AddDocument from '@/assets/icons/AddDocument.vue';
import { useWorkSpaceStore } from '../store/workSpaceStore';
import { computed, ref, watch } from 'vue';
import Tree from '@/shared/components/tree/Tree.vue';
import type { TreeNode } from '@/shared/components/tree/contract';
import { useTreeController } from '@/shared/components/tree/baseTreeController';
import { onClickOutside } from '@vueuse/core';
import { useGlobalTabStore } from '../store/browserTabsStore';

const fileSystem = ref<TreeNode[]>([
  {
    id: 1,
    title: 'src',
    type: {
        id: 'page',
        name: 'A1',
        icon: {
            id: 'icon-default-document',
            type: 'emoji',
            emoji: '🧁'
        }
    },
    children: [
      { id: 4, title: '1-3', children: [] },
      { id: 2, title: '1-1', children: [] },
      { id: 3, title: '1-2', children: [] },
      { 
        id: 5, 
        title: '1-4', 
        children: [
            { id: 6, title: '1-4-1',children: []},
            { 
                id: 7, 
                title: '1-4-2',
                type: {
                    id: 'page',
                    name: 'A1',
                    icon: {
                        id: 'icon-default-document',
                        type: 'default',
                        name: 'object'
                    },
                }, 
                children: [
                    {
                        id: 1123,
                        title: '1-4-2-1',
                        type: {
                            id: 'page',
                            name: 'A1',
                            icon: {
                                id: 'icon-default-document',
                                type: 'emoji',
                                emoji: 'IДІ'
                            }
                        }, children: []
                    }
                ] 
            },
            { id: 8, title: '1-4-3', children: [] },
        ]
      },
      { 
        id: 9, 
        title: '1-5', 
        children: [
            { id: 10, title: '1-5-1', children: [] },
            { id: 11, title: '1-5-2', children: [] },
            { id: 12, title: '1-5-3', children: [] },
            { id: 13, title: '1-5-4', children: [] },
            { id: 14, title: '1-5-5', children: [] },
        ]
      },
    ]
  }
])
const treeRef = ref()

const treeController = useTreeController(fileSystem)
const workSpaceStore = useWorkSpaceStore();
const tabStore = useGlobalTabStore();
const isSidebarOpen = computed(() => workSpaceStore.isSidebarOpen)

onClickOutside(treeRef, (event: Event) => {
    if(treeController.selectedId.value !== tabStore.activeTab?.id){
        treeController.clearSelection()
    }
})

watch(
    () => tabStore.activeTab, 
    ()=>{
        if(tabStore.activeTab?.id){
            treeController.selectNode(tabStore.activeTab.id)
        }   
    }
)

watch(
    () => treeController.selectedId.value, 
    (pageId)=>{
        if(pageId){
            const res = tabStore.openTab(pageId)
        }   
    }
)

const complexMenuData: MenuGroup[] = [
  {
    title: 'Account',
    items: [
        { type: 'button', label: 'Profile', icon: Document },
        { type: 'divider' },
        { type: 'button', label: 'Settings', icon: Document },
    ]
  },
]

</script>

<template>
<div 
    class="flex flex-col"
    >

    <BaseButton 
        class="w-full" 
        :is-content-visible="isSidebarOpen" 
        @click="workSpaceStore.toggleOmniSearch" 
        :icon="Search"
        data-search-trigger
        >
            Search
    </BaseButton>
    <BaseButton 
        class="w-full" 
        :is-content-visible="isSidebarOpen" 
        :icon="TypeDicitionary"
        >
            Type
    </BaseButton>
    <BaseButton 
        class="w-full" 
        :is-content-visible="isSidebarOpen" 
        :icon="Graph"
        >
            Data views
    </BaseButton>

    <div v-show="isSidebarOpen">

        <Accordion label="Fast Actions" :menu-data="complexMenuData">
            <BaseButton 
                class="w-full" 
                :is-content-visible="isSidebarOpen" 
                :icon="AddDocument"
                >
                    Example action 1
            </BaseButton>
            <BaseButton 
                class="w-full" 
                :is-content-visible="isSidebarOpen" 
                :icon="AddDocument"
                >
                    Example action 2
            </BaseButton>
            <BaseButton 
                class="w-full" 
                :is-content-visible="isSidebarOpen" 
                :icon="AddDocument"
                >
                    Example action 3
            </BaseButton>
        </Accordion>
        
        <Accordion label="Pinned" :menu-data="complexMenuData">
            <BaseButton 
                class="w-full" 
                :is-content-visible="isSidebarOpen" 
                :icon="AddDocument"
                >
                    Example document 1
            </BaseButton>
            <BaseButton 
                class="w-full" 
                :is-content-visible="isSidebarOpen" 
                :icon="AddDocument"
                >
                    Example document 2
            </BaseButton>
            <BaseButton 
                class="w-full" 
                :is-content-visible="isSidebarOpen" 
                :icon="AddDocument"
                >
                    Example document 3
            </BaseButton>
        </Accordion>
        
        <Accordion label="Tree" :menu-data="complexMenuData">
            <Tree ref="treeRef" :controller="treeController" />
        </Accordion>
        
    </div>
</div>

</template>
