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
import { computed } from 'vue';


const store = useWorkSpaceStore();

const isSidebarOpen = computed(() => store.isSidebarOpen)

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
        @click="store.toggleOmniSearch" 
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
            <span>
            ...
            </span>
        </Accordion>
        
    </div>
</div>

</template>
