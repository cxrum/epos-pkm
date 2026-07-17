<template>
  <div class="page-link-block-wrapper">
    <div
      class="surface-editor-card"
      contenteditable="false"
      @click="wrapAction(openPage)"
    >
      <span v-show="isLoading" class="loading"> Loading... </span>
      <span v-show="!isLoading" class="title flex flex-row gap-2 items-center">
        <BaseIcon size="28px">
          <DynamicIcon :icon="icon"></DynamicIcon>
        </BaseIcon>
        <span>{{ title }}</span>
      </span>
    </div>

    <div style="display: none">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useGlobalObjectStore } from "@/core/store/globalObjectStore";
import { useGlobalNavigation } from "@/core/store/navigationStore";
import type { Icon } from "@/core/types";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";
import { ref, computed, watchEffect, type Ref } from "vue";

const globalObjectStore = useGlobalObjectStore();
const globalNavigationStore = useGlobalNavigation();

const props = defineProps<{
  nodeAttributes: Record<string, any>;
  updateAttributes: (attrs: Record<string, any>) => void;
  wrapAction: (action: () => void) => void;
}>();

const targetPageId = computed(() => props.nodeAttributes.domainContent?.toId);

const title = ref("Unknown");
const icon: Ref<Icon> = ref({
  type: "default",
  name: "error",
});
const isLoading = ref(true);

watchEffect(async () => {
  const id = targetPageId.value;

  if (!id) {
    title.value = "Link error";
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    const res = await globalObjectStore.getMetaInfo(id);
    title.value = res.title ?? "Unknown";
    icon.value = res.icon ?? {
      type: "default",
      name: "error",
    };
  } catch (error) {
    console.error("Page is not exist:", error);
    title.value = "Not found";
  } finally {
    isLoading.value = false;
  }
});

const openPage = async () => {
  const targetId = targetPageId.value;
  if (targetId) {
    await globalNavigationStore.openPage(targetId);
  }
};
</script>
