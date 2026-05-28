import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import type { Path } from '../domain/type'

export const useWorkSpaceStore = defineStore('workspace', () => {
    const isSidebarOpen = ref<boolean>(true)
    const isTypeEditorOpen = ref<boolean>(false)
    const isOmniSearchOpen = ref<boolean>(false)
    const isLoading = ref<boolean>(false)
    
    function toggleSidebar() {
        isSidebarOpen.value = !isSidebarOpen.value
    }
    
    function toggleTypeEditor() {
        isTypeEditorOpen.value = !isTypeEditorOpen.value
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
            isTypeEditorOpen, 
            isOmniSearchOpen,
            isLoading,
            
            setLoadingStatus,
            toggleSidebar, 
            toggleTypeEditor, 
            toggleOmniSearch,
            closeOmniSearch
        }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkSpaceStore, import.meta.hot))
}