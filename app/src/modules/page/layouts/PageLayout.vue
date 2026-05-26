<script setup lang="ts">
import { ref, watch } from 'vue';
import { useWorkSpaceStore } from '@/core/store/workSpaceStore';
import { usePageStore } from '../store/pageStore';
import BaseEditor from '../components/editor/views/BaseEditor.vue'
import { useGlobalTabStore } from '@/core/store/browserTabsStore';

const props = defineProps();
const pageStore = usePageStore();
const workSpaceStore = useWorkSpaceStore();
const globalTabStore = useGlobalTabStore();

const pageJsonData = ref<Record<string, any>>({});

watch(
    () => globalTabStore.activeTab,
    (activeTab) => {
        if (activeTab != null && activeTab.id !== -1) {
            pageStore.getFromDatabase(activeTab.id);
            workSpaceStore.setLoadingStatus(true)
        }
    },
    { deep: true }
);

watch(
    () => pageStore.pageData,
    (newData) => {
        if (newData) {
            workSpaceStore.setCurrentPath(newData.path);
            pageJsonData.value=newData.content
            workSpaceStore.setLoadingStatus(false)
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
    <BaseEditor v-if="globalTabStore.activeTab" v-model="pageJsonData"></BaseEditor>
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