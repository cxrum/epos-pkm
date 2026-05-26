import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoadedPage } from '../types'

export const useGlobalTabStore = defineStore('pages-data', () => {
    const openedTabs = ref<Record<number, LoadedPage>>({
        1:{
            id: 1, 
            title: "A1", 
            type: {
                id: 'page',
                name: 'Default Page Type',
                icon: {
                  id: 'icon-default-document',
                  type: 'default',
                  name: 'document'  
                }
            }
        },
        2:{
            id: 2, 
            title: "A2", 
            type: {
                id: 'page',
                name: 'Default Page Type',
                icon: {
                  id: 'icon-default-document',
                  type: 'default',
                  name: 'document'  
                }
                
            }
        },
        3:{
            id: 3, 
            title: "A3", 
            type: {
                id: 'page',
                name: 'Default Page Type',
                icon: {
                  id: 'icon-default-document',
                  type: 'default',
                  name: 'document'  
                }
            }
        },
    })

    const activeTab = ref<LoadedPage>()

    const closeTab = (id: number) => {
        delete openedTabs.value[id]
    }

    const openTab = (id: number): boolean => {
        activeTab.value = openedTabs.value[id]
        return openedTabs.value[id] !== undefined     
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