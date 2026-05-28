import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import type { PageMetha } from '../types'

export const useGlobalTabStore = defineStore('pages-data', () => {
    const openedTabs = ref<PageMetha[]>([])

    const activeTab = ref<PageMetha>()

    const clearSelection = () => {
        activeTab.value = undefined 
    }

    const closeTab = (id: number) => {
        const index = openedTabs.value.findIndex(tab => tab.id === id)
        if (index !== -1) {
            openedTabs.value.splice(index, 1)
        }

        if (id === activeTab.value?.id){
            clearSelection()
        }
    }

    const openTab = (id: number): boolean => {
        const foundTab = openedTabs.value.find(tab => tab.id === id)
        if (foundTab) {
            activeTab.value = foundTab
            return true
        }
        return false
    }

    const createTab = (tab: PageMetha) => {
        const exists = openedTabs.value.some(existingTab => existingTab.id === tab.id)
        if (!exists) {
            openedTabs.value.push(tab)
        }
    }

    return { 
        openedTabs, 
        activeTab,
        clearSelection,
        createTab,
        openTab, 
        closeTab, 
    }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGlobalTabStore, import.meta.hot))
}