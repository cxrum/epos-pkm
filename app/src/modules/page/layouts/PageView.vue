<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePagesStore } from '../../../core/store/pagesStore';
import { useWorkSpaceStore } from '../../../core/store/workSpaceStore';
import type { PageData } from '../../../core/types';
import CommandLine from '../../commandline/layouts/CommandLine.vue';


const props = defineProps()
const pagesStore = usePagesStore();
const workSpaceStore = useWorkSpaceStore();

const defaultPage:PageData = {
    id: -1,
    title: 'Default',
    data: [
        {
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent placerat urna in sapien pellentesque dignissim. Cras vestibulum, tellus eu feugiat commodo, est ex fermentum massa, vitae consectetur sem felis a mauris. Sed sit amet molestie sem. Pellentesque faucibus ultricies mauris, non pulvinar libero. Nulla facilisi. Integer viverra tincidunt congue. Morbi at elit quis libero placerat accumsan ut a odio. '
        },
        {
            text: 'This page is default :)' 
        }
    ],
    path: []
}

const computeCurrentPage = computed<PageData>(()=>{
    const id = workSpaceStore.activePage
    const pageData = pagesStore.getPageById(id) 
    var currentPage: PageData;

    if(pageData == null) {
        currentPage = defaultPage
    }else{
        currentPage = pageData
    }
    
    workSpaceStore.setCurrentPath(currentPage.path)

    return currentPage
})


</script>

<template>
<div class="flex flex-col gap-2 w-full h-full page">
    <h1>{{computeCurrentPage.title }}</h1>
    <span 
        v-for="value in computeCurrentPage.data"
    >
        {{ value.text }}
    </span>

    <span>
        <CommandLine></CommandLine>
    </span>

    <div class="h-80 shrink-0"></div>
</div>
</template>

<style lang="css" scoped>
    .page {
        padding-left: clamp(16px, 8vw, 128px);
        padding-right: clamp(16px, 8vw, 128px);
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
    }
</style>