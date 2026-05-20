import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import type { Path } from '../types'

export const useWorkSpaceStore = defineStore('workspace', () => {
    const isSidebarOpen = ref<boolean>(true)
    const isTypeEditorOpen = ref<boolean>(false)
    const isOmniSearchOpen = ref<boolean>(false)

    const activePage = ref<number>(-1)
    const currentPath = ref<Path[]>([])
    
    function setActivePage(pageId: number) {
        activePage.value = pageId
    }

    function toggleSidebar() {
        isSidebarOpen.value = !isSidebarOpen.value
    }
    
    function toggleTypeEditor() {
        isTypeEditorOpen.value = !isTypeEditorOpen.value
    }

    function putCurrentPath(el: Path) {
        currentPath.value.push(el)
    }

    function setCurrentPath(els: Path[]){
        currentPath.value = els
    }
        
    const toggleOmniSearch = () => {
        isOmniSearchOpen.value = !isOmniSearchOpen.value 
    }

    const closeOmniSearch = () => {
        isOmniSearchOpen.value = false 
    }

    return {
            isSidebarOpen, 
            currentPath, 
            isTypeEditorOpen, 
            activePage, 
            isOmniSearchOpen,
            
            setActivePage,
            putCurrentPath, 
            setCurrentPath, 
            toggleSidebar, 
            toggleTypeEditor, 
            toggleOmniSearch,
            closeOmniSearch
        }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkSpaceStore, import.meta.hot))
}