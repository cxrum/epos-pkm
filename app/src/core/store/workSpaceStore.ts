import type { Path } from '@/modules/page/domain/pageRepositoryContract'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

export const useWorkSpaceStore = defineStore('workspace', () => {
    const isSidebarOpen = ref<boolean>(true)
    const isTypeEditorOpen = ref<boolean>(false)
    const isOmniSearchOpen = ref<boolean>(false)
    const isLoading = ref<boolean>(false)

    const currentPath = ref<Path[]>([]) // TODO: fix the dependency direction
    
    function toggleSidebar() {
        isSidebarOpen.value = !isSidebarOpen.value
    }
    
    function toggleTypeEditor() {
        isTypeEditorOpen.value = !isTypeEditorOpen.value
    }

    function putCurrentPath(el: Path) {
        currentPath.value.push(el)
    }

    function setCurrentPath(els?: Path[]){
        if(els == null){
            currentPath.value = []
            return
        }
        currentPath.value = els
    }
        
    const toggleOmniSearch = () => {
        isOmniSearchOpen.value = !isOmniSearchOpen.value 
    }

    const closeOmniSearch = () => {
        isOmniSearchOpen.value = false 
    }

    const setLoadingStatus = (value: boolean) =>{
        isLoading.value = value
    }

    return {
            isSidebarOpen, 
            currentPath, 
            isTypeEditorOpen, 
            isOmniSearchOpen,
            isLoading,
            
            setLoadingStatus,
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