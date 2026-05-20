<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseIcon from '@/shared/components/BaseIcon.vue';
import Cross from '@/assets/icons/Cross.vue';
import SidebarState from '@/assets/icons/SidebarState.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import ArrowLeft from '@/assets/icons/ArrowLeft.vue';

const router = useRouter()

const closeModal = () => {
  router.push('/workspace')
}

const isCategoriesOpen = ref(false)

const openCategories = () => {
    isCategoriesOpen.value = true
}

const closeCategories = () => {
    isCategoriesOpen.value = false
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

</script>
<template>
<Teleport to="body">
<div 
    class="fixed flex z-100 p-0 md:py-16 md:px-24 items-center justify-center inset-0 bg-black/30"
    @click.self="closeModal"
    >
    <div class="flex flex-col w-full h-full max-w-6xl bg-(--bg-settings) md:border border-(--border) rounded-none md:rounded-2xl shadow-xl relative overflow-hidden">
        
        <div class="flex flex-row flex-1 relative">
            
            <div 
                :class="isCategoriesOpen ? 'flex' : 'hidden md:flex'"
                class="absolute md:relative pt-6 px-4 md:min-w-64 md:w-64 md:inset-auto inset-0 flex-col border-r border-(--border) bg-(--bg-settings)"
            >
                <div class="flex flex-row items-center gap-2">
                    <BaseIcon 
                        size="32px"
                        interactive @click="closeCategories"
                        class="text-(--icon-color) md:hidden"
                        >
                        <ArrowLeft></ArrowLeft>
                    </BaseIcon>
                    
                    <h1 class="text-(--text-secondary-color)">
                        Categories
                    </h1>
                </div>

            </div>

            <div class="flex flex-col flex-1 pt-6 px-4">
                <div class="flex flex-row items-center gap-2">
                    <BaseIcon 
                        size="32px" 
                        class="text-(--icon-color) md:hidden"
                        interactive @click="openCategories" 
                        >
                        <SidebarState :status="isCategoriesOpen ? 'closed':'opened' "/>
                    </BaseIcon>
                
                    <h1 class="flex-1 text-(--text-secondary-color)">
                        General
                    </h1>
                </div>
                
            </div>
        </div>
        <BaseIcon 
            size="32px"
            interactive @click="closeModal"
            class="absolute top-4 right-4"
            >
            <Cross></Cross>
        </BaseIcon>
    </div>
</div>
</Teleport>  
</template>

<style scoped>

</style>