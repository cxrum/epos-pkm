<script setup lang="ts">
import SidebarNavigationView from './SidebarNavigationView.vue';
import BrowserTabsView from './BrowserTabsView.vue'
import { useWorkSpaceStore } from '../store/workSpaceStore';
import Breadcrumbs from '../components/Breadcrumbs.vue';
import { computed, ref } from 'vue';
import BaseIcon from '../components/BaseIcon.vue';
import DotsMenu from '../../assets/icons/DotsMenu.vue';
import TypeIcon from '../../assets/icons/TypeIcon.vue';
import TypeEditor from '../components/TypeEditor.vue';
import { onClickOutside, transition } from '@vueuse/core';
import SidebarState from '../../assets/icons/SidebarState.vue';
import type { MenuGroup } from '../components/popUpMenu/type';
import { flip, offset, useFloating } from '@floating-ui/vue';
import PopUpMenu from '../components/popUpMenu/PopUpMenu.vue';
import Document from '../../assets/icons/Document.vue';
import OmniSearchView from './OmniSearchView.vue';
import User from '../../assets/icons/User.vue';
import Settings from '../../assets/icons/Settings.vue';

const workSpaceStore = useWorkSpaceStore();

const currPath = computed(() => workSpaceStore.currentPath)
const isTypeEditorOpen = computed(() => workSpaceStore.isTypeEditorOpen)
const isSidebarOpen = computed(() => workSpaceStore.isSidebarOpen)
const isOmniSearchOpen = computed(() => workSpaceStore.isOmniSearchOpen)
const isPopUpMenuOpen = ref<boolean>(false)

const handleStateButonClick = (event: Event) => {
    workSpaceStore.toggleSidebar();
}

const pageMenuButtonRef = ref<HTMLElement | null>(null)
const pageMenuRef = ref<HTMLElement | null>(null)
const { floatingStyles: pageMenuStyles } = useFloating(pageMenuButtonRef, pageMenuRef, {
    placement: 'bottom-end',
    middleware: [
        offset(8),
    ],
    open: isPopUpMenuOpen
})

const pageRef = ref<HTMLElement | null>(null)
const omniSearchRef = ref<HTMLElement | null>(null)
const { floatingStyles: omniSearchStyle } = useFloating(pageRef, omniSearchRef,  {
    placement: 'top',
    middleware: [
    offset(({ rects }) => {
      return -rects.reference.height / 2 - rects.floating.height / 2;
    }),
  ],
  open: isOmniSearchOpen
})

const toglePopUpMenu = () => {
    isPopUpMenuOpen.value = !isPopUpMenuOpen.value 
}

onClickOutside(pageMenuRef, () => {
    isPopUpMenuOpen.value = false
},  { ignore: [pageMenuButtonRef] })

onClickOutside(omniSearchRef, (event: Event) => {
  const target = event.target as HTMLElement
  
  if (target.closest('[data-search-trigger]')) {  
      return
  }
    workSpaceStore.closeOmniSearch()
})

const pageMenuData: MenuGroup[] = [
  {
    title: 'Page',
    items: [
        { type: 'button', label: 'Wtf', icon: Document },
        { type: 'divider' },
        { type: 'button', label: 'Wtf', icon: Document },
    ]
  },
]

const computedPath = computed<string[]>(() => {
  return workSpaceStore.currentPath.map((value) => value.title)
})


</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden text-(--fixel)">
    
    <aside 
      :class="isSidebarOpen ? 'w-64' : 'w-14'"
      class="flex flex-col h-full border-r border-(--border) bg-(--bg-sidebar) transition-all duration-200 ease-in-out"
      >
      <BaseIcon 
        size="32px" 
        class="text-(--icon-color) m-2"
        interactive @click="handleStateButonClick" 
        >
        <SidebarState :status="isSidebarOpen ? 'closed':'opened' "/>
      </BaseIcon>
  
      <SidebarNavigationView class="p-2 flex-1 overflow-y-auto auto-hide-scroll" />

      <div class="flex flex-row items-center p-2 border-t border-(--border)"
        :class="isSidebarOpen ? '':'justify-center'"
      >
        <BaseIcon size="32px" v-show="isSidebarOpen" class="shrink-0">
          <User/>
        </BaseIcon>
        <span class="flex-1" v-show="isSidebarOpen">
          UserName
        </span>

        <router-link to="/workspace/settings" class="clickable rounded-md">
          <BaseIcon size="32px" class="shrink-0">
            <Settings/>
          </BaseIcon>
        </router-link>
        
      </div>
    </aside>
    
    <main class="flex h-full min-w-0 flex-1 flex-col">
      <header class="flex h-12 shrink-0 items-end border-b border-(--border) bg-(--bg-header) px-2">
        <BrowserTabsView />
      </header>
      
      <div class="w-full flex-1 min-h-0 flex flex-row bg-(--bg-canva)">
        
        <section ref="pageRef" class="flex-1 flex flex-col min-w-0">
          
          <nav class="flex shrink-0 bg-(--bg-canva) p-1 items-center">
            <Breadcrumbs :path="computedPath"/>
            
            <BaseIcon 
              size="28px" 
              interactive @click="workSpaceStore.toggleTypeEditor()" 
              class="text-(--icon-color) shrink-0"
              :class="isTypeEditorOpen ? 'bg-(--hover)' : ''"
              >
              <TypeIcon/>
            </BaseIcon>

            <BaseIcon 
                size="28px"
                interactive @click="toglePopUpMenu"
                ref="pageMenuButtonRef"
                class="text-(--icon-color) shrink-0"
              >
              <DotsMenu/>
            </BaseIcon>
            
            <transition name="fade">
                <PopUpMenu
                    ref="pageMenuRef"
                    :groups="pageMenuData"
                    :style="pageMenuStyles"
                    v-if="isPopUpMenuOpen"
                />
            </transition>

          </nav>
          
          
          <transition name="fade">
            <OmniSearchView
              ref="omniSearchRef"
              v-if="isOmniSearchOpen"
              :style="omniSearchStyle"
              ></OmniSearchView>
          </transition>


          <div class="flex-1 overflow-y-auto auto-hide-scroll">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" class="min-h-full" />
              </transition>
            </router-view>
          </div>

          <router-view name="modal"></router-view>

        </section>
        
        <div
          class="h-full w-64 p-2 border-l border-(--border) bg-(--bg-sidebar) overflow-y-auto auto-hide-scroll"
          v-if="isTypeEditorOpen"
          >
            <TypeEditor/>
        </div>

      </div>
      
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: 0.2s ease-in-out;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(256px);
}
</style>