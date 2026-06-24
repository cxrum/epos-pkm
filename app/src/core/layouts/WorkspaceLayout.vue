<script setup lang="ts">
import SidebarNavigationView from "@/core/layouts/SidebarNavigationView.vue";
import BrowserTabsView from "@/core/layouts/BrowserTabsView.vue";
import { useWorkspaceStore } from "@/core/store/workspaceStore";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import { onClickOutside, transition } from "@vueuse/core";
import SidebarState from "@/assets/icons/SidebarState.vue";
import { offset, useFloating } from "@floating-ui/vue";
import OmniSearchView from "@/core/layouts/OmniSearchView.vue";
import User from "@/assets/icons/User.vue";
import Settings from "@/assets/icons/Settings.vue";
import LoadingBar from "@/shared/components/LoadingBar.vue";
import { useGlobalNavigation } from "../store/navigationStore";

const workSpaceStore = useWorkspaceStore();

const isWorkspaceReady = ref(false);
const hasError = ref(false);

onMounted(() => {
  try {
    isWorkspaceReady.value = true;
    workSpaceStore.init();
  } catch (error) {
    hasError.value = true;
  }
});

const isSidebarOpen = computed(() => workSpaceStore.isSidebarOpen);
const isOmniSearchOpen = computed(() => workSpaceStore.isOmniSearchOpen);

const globalNavigationStore = useGlobalNavigation();

const handleStateButtonClick = () => {
  workSpaceStore.toggleSidebar();
};

const pageRef = ref<HTMLElement | null>(null);
const omniSearchRef = ref<HTMLElement | null>(null);
const { floatingStyles: omniSearchStyle } = useFloating(
  pageRef,
  omniSearchRef,
  {
    placement: "top",
    middleware: [
      offset(({ rects }) => {
        return -rects.reference.height / 2 - rects.floating.height / 2;
      }),
    ],
    open: isOmniSearchOpen,
  },
);

onClickOutside(omniSearchRef, (event: Event) => {
  const target = event.target as HTMLElement;

  if (target.closest("[data-search-trigger]")) {
    return;
  }
  workSpaceStore.closeOmniSearch();
});
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden">
    <aside
      :class="isSidebarOpen ? 'w-64' : 'w-14'"
      class="flex flex-col h-full border-r border-(--border) bg-(--bg-sidebar) transition-all duration-150 ease-in-out"
    >
      <BaseIcon
        size="32px"
        class="text-(--icon-color) m-2"
        interactive
        @click="handleStateButtonClick"
      >
        <SidebarState :status="isSidebarOpen ? 'closed' : 'opened'" />
      </BaseIcon>

      <SidebarNavigationView
        class="p-2 flex-1 overflow-y-auto auto-hide-scroll"
      />

      <div
        class="flex flex-row items-center p-2 border-t border-(--border)"
        :class="isSidebarOpen ? '' : 'justify-center'"
      >
        <BaseIcon size="32px" v-show="isSidebarOpen" class="shrink-0">
          <User />
        </BaseIcon>
        <span class="flex-1" v-show="isSidebarOpen"> UserName </span>

        <router-link to="/workspace/settings" class="clickable rounded-md">
          <BaseIcon size="32px" class="shrink-0">
            <Settings />
          </BaseIcon>
        </router-link>
      </div>
    </aside>

    <main class="flex h-full min-w-0 flex-1 flex-col">
      <header
        class="flex h-12 shrink-0 items-end border-b border-(--border) bg-(--bg-header) px-2"
      >
        <BrowserTabsView />
      </header>

      <div class="w-full flex-1 min-h-0 flex flex-row bg-(--bg-canvas)">
        <section ref="pageRef" class="flex-1 flex flex-col min-w-0">
          <Teleport to="body">
            <transition name="fade">
              <OmniSearchView
                ref="omniSearchRef"
                v-if="isOmniSearchOpen"
                :style="omniSearchStyle"
              ></OmniSearchView>
            </transition>
          </Teleport>

          <div class="flex-1 min-h-full">
            <router-view
              v-if="globalNavigationStore.activePage"
              v-slot="{ Component }"
            >
              <component :is="Component" />
            </router-view>
            <div
              v-else
              class="flex flex-col flex-1 items-center place-content-center w-full h-full"
            >
              <p>Create a new note (shortcut placeholder)</p>
              <p>Select page from tree or browser tab</p>
            </div>
          </div>

          <router-view name="modal"></router-view>
        </section>
      </div>
      <div v-if="workSpaceStore.isLoading">
        <LoadingBar />
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
  transition: 0.15s ease-in-out;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(256px);
}
</style>
