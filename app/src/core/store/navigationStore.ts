import { defineStore } from "pinia";
import type { PageMetha } from "../types";
import { ref } from "vue";
import { PageRepository } from "../infra/storage/stubPageRepository";
import type { Path } from "../domain/type";

export const useGlobalNavigation = defineStore('navigation', () => {
    const activePage = ref<PageMetha>()
    const chachedPageMeta = ref<Record<number, PageMetha>>({});
    const currentPath = ref<Path[]>([])

    function setCurrentPath(els?: Path[]){
        if(els == null){
            currentPath.value = []
            return
        }
        currentPath.value = els
    }

    const preloadPageMeta = async (pageId: number) => {
        const result = await PageRepository.get(pageId);
        if (result) {
            chachedPageMeta.value[pageId] = {
            id: result.id,
            title: result.title,
            type: result.type
            };
        }
        activePage.value = chachedPageMeta.value[pageId]
    };

    const getMetaInfo = (pageId: number): PageMetha | undefined => {
        return chachedPageMeta.value[pageId];
    };
    
    const openPage = (pageId: number) => {
        const metha = getMetaInfo(pageId)
        if(metha !== undefined){
            activePage.value = metha
        }else{
            preloadPageMeta(pageId)
        }
    }

    const closePage = (pageId: number) => {
        if (pageId === activePage.value?.id){
            activePage.value = undefined
        }
    }

    const clearPageSelection = () => {
        activePage.value = undefined
    }

    const clearCurrentPath = () => {
        currentPath.value = []
    }

    return {
        activePage,
        currentPath,

        setCurrentPath,
        clearCurrentPath,
        clearPageSelection,
        getMetaInfo,
        preloadPageMeta,
        openPage,
        closePage
    }
});