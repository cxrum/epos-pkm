import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoadedPage } from '../types'

export const useGlobalTabStore = defineStore('pages-data', () => {
    const openedTabs = ref<Record<number, LoadedPage>>({
        1:{id: 1, title: "A1", type: 'page'},
        2:{id: 2, title: "A2", type: 'page'},
        3:{id: 3, title: "A3", type: 'type'},
        4:{id: 4, title: "A4", type: 'table'},
    })

    const activeTab = ref<LoadedPage>({id:-1, title: 'default', type: 'page'})

    const closeTab = (id: number) => {
        delete openedTabs.value[id]
    }

    const openTab = (id: number) => {
        activeTab.value = openedTabs.value[id]
    }

    const createTab = (tab: LoadedPage) => {
        openedTabs.value[tab.id] = tab 
    }

    return { 
        openedTabs, 
        activeTab,

        createTab,
        openTab, 
        closeTab, 
    }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGlobalTabStore, import.meta.hot))
}