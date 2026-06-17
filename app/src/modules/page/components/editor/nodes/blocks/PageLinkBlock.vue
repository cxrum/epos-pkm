<template>
  <div class="page-link-card" @click="openPage">
    <span v-if="isLoading" class="loading"> Loading...</span>
    <span v-else class="title flex flex-row gap-2 items-center">
      <BaseIcon size="28">
        <DynamicIcon :icon="icon"> </DynamicIcon>
      </BaseIcon>
      {{ title }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { isAnyContainer } from "@/core/domain/type";
import { useGlobalObjectStore } from "@/core/store/globalObjectStore";
import type { Icon } from "@/core/types";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";
import { ref, computed, watchEffect, type Ref } from "vue";

const store = useGlobalObjectStore();

const props = defineProps<{
  nodeAttributes: Record<string, any>;
  updateAttributes: (attrs: Record<string, any>) => void;
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
    const res = await store.get(id);
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

const openPage = () => {
  const targetId = targetPageId.value;
  if (targetId) {
    console.log("OPEN:", targetId);
  }
};
</script>
