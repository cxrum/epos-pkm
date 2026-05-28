<script setup lang="ts">
import { ref, watch } from 'vue';
import { useWorkSpaceStore } from '@/core/store/workSpaceStore';
import { useGlobalPageStore } from '../../../core/store/globalPageStore.ts';
import BaseEditor from '../components/editor/views/BaseEditor.vue'
import { useGlobalNavigation } from '@/core/store/navigationStore.ts';

const props = defineProps();
const pageStore = useGlobalPageStore();
const workSpaceStore = useWorkSpaceStore();
const globalNavigationStore = useGlobalNavigation();

const pageJsonData = ref<Record<string, any>>({});

watch(
    () => globalNavigationStore.activePage,
    (activePage) => {
        if (activePage != null && activePage.id !== -1) {
            pageStore.getFromDatabase(activePage.id);
            workSpaceStore.setLoadingStatus(true)
        }else{
            pageStore.clearActivePage()
        }
    },
    { deep: true }
);

watch(
    () => pageStore.pageData,
    (newData) => {
        if (newData) {
            globalNavigationStore.setCurrentPath(pageStore.paths[newData.id])
            pageJsonData.value=newData.content
            workSpaceStore.setLoadingStatus(false)
        }else{
            globalNavigationStore.clearCurrentPath()
        }
    }
)

watch(
    pageJsonData,
    (newData) => {
        if (newData) {
            pageStore.updateContent(newData);
        }
    },
    { deep: true }
);


</script>

<template>
<div v-if="pageStore.pageData" class="flex flex-col gap-2 w-full h-full page">
    <h1>{{pageStore.pageData.title}}</h1>
    <BaseEditor v-if="globalNavigationStore.activePage" v-model="pageJsonData"></BaseEditor>
    <div class="h-80 shrink-0"></div>
</div>
<div v-else class="flex flex-col justify-center items-center gap-2 w-full h-full page">
    <p>Create a new note (shortcut placeholder)</p>
    <p>Select page from tree or browser tab</p>
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