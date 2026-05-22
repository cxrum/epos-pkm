<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseIcon from '@/shared/components/BaseIcon.vue';
import Cross from '@/assets/icons/Cross.vue';
import SidebarState from '@/assets/icons/SidebarState.vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ArrowLeft from '@/assets/icons/ArrowLeft.vue';
import { useGlobalSettingsStore } from '@/core/store/globalSettingsStore';
import BaseCheckbox from '@/shared/components/BaseCheckbox.vue';
import BaseInput from '@/shared/components/BaseInput.vue';
import BaseSelect from '@/shared/components/BaseSelect.vue';

const globalSettingsStore = useGlobalSettingsStore();
const router = useRouter();

const categories = computed(() => globalSettingsStore.categories)
const selectedCategory = ref<string>("")

const settings = computed(() => {
    if(selectedCategory.value == undefined || !selectedCategory){
        return []
    }

    return globalSettingsStore.settingsByCategory(selectedCategory.value)
})

const componentMap: Record<string, any> = {
  'boolean': BaseCheckbox,
  'text': BaseInput,
  'number': BaseInput,
  'select': BaseSelect
}

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
        
        <div class="flex flex-row w-full h-full relative">
            
            <div 
                :class="isCategoriesOpen ? 'flex' : 'hidden md:flex'"
                class="absolute md:relative pt-6 px-8 md:min-w-64 md:w-64 md:inset-auto inset-0 flex-col border-r border-(--border) bg-(--bg-settings)"
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
                
                <nav class="flex flex-col flex-1 overflow-auto auto-hide-scroll">
                    <div class="h-8 shrink-0"></div>
                    <label 
                        v-for="value in categories" 
                        :key="value.id"
                        class="flex items-center py-2 px-3 rounded-md cursor-pointer clickable transition-colors"
                        :class="selectedCategory === value.id ? 'bg-(--tab-active-bg)' : ''"
                        >
                        <div class="flex items-center">
                            <input 
                            type="radio" 
                            v-model="selectedCategory" 
                            :value="value.id"
                            class="w-4 h-4"
                            />
                            <span class="text-(-text-secondary-color)">{{ value.label }}</span>
                        </div>
                    </label>
                    
                    
                </nav>  
            </div>

            <div class="flex flex-col flex-1 pt-6 ps-8">
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

                <div class="flex flex-col flex-1 px-4 overflow-y-auto auto-hide-scroll">
                    <div class="h-6 shrink-0"></div>

                    <div v-for="setting in settings">
                        <div class="flex flex-col gap-2">
                            <h3>{{ setting.label }}</h3>
                            <span v-if="setting.description">
                                {{ setting.description }}
                            </span>
                            
                            <component 
                                :is="componentMap[setting.type]"
                                :modelValue="setting.value"
                                :options="setting.options"
                                @update:modelValue="(val) => store.updateSetting(setting.id, val)"
                            />
                        </div>
                    </div>
                    
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
                    <h1>ANNNTOOON</h1>
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

<style lang="css" scoped>
input[type="radio"]{
  visibility: hidden;
  height: 0;
  width: 0;
}
label:hover{
    background-color: var(--hover);
}
</style>