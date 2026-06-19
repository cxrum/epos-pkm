<script setup lang="ts">
import { watch } from "vue";
import { useGlobalPageStore } from "../../../core/store/globalPageStore.ts";
import { useGlobalNavigation } from "@/core/store/navigationStore.ts";
import { isSystemPageMeta } from "@/core/types.ts";

const props = defineProps();
const pageStore = useGlobalPageStore();
const globalNavigationStore = useGlobalNavigation();

watch(
  () => globalNavigationStore.activePage,
  (activePage) => {
    if (activePage && isSystemPageMeta(activePage)) {
      pageStore.get(activePage.id);
    } else {
      pageStore.clearActiveObject();
    }
  },
  { deep: true },
);
</script>

<template>
  <p>STUB</p>
</template>

<style lang="css" scoped>
.page {
  padding-left: clamp(16px, 8vw, 128px);
  padding-right: clamp(16px, 8vw, 128px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}
</style>
