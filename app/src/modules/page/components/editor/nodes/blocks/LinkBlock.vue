<template>
  <div
    class="surface-editor-card"
    contenteditable="false"
    @click="wrapAction(openPage)"
  >
    <template v-if="isLoading">
      <div class="loading">Loading...</div>
    </template>

    <template v-else-if="targetPageId === '-1'">
      <div class="flex justify-center items-center">Select related object!</div>
    </template>
    <template v-else>
      <span class="title flex flex-row gap-2 items-center">
        <BaseIcon size="28px">
          <DynamicIcon :icon="icon"> </DynamicIcon>
        </BaseIcon>
        <span class="flex flex-1 flex-col">
          <span class="flex flex-row w-full justify-between">
            <label>{{ path }}</label>
            <label>{{ type }}</label>
          </span>
          <p>{{ title }}</p>
        </span>
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useGlobalObjectStore } from "@/core/store/globalObjectStore";
import { useGlobalTypeStore } from "@/core/store/globalTypeStore";
import { useGlobalNavigation } from "@/core/store/navigationStore";
import type { Icon } from "@/core/types";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";
import { ref, computed, watchEffect, type Ref } from "vue";

const objectStore = useGlobalObjectStore();
const typeStore = useGlobalTypeStore();
const navigation = useGlobalNavigation();

const props = defineProps<{
  nodeAttributes: Record<string, any>;
  updateAttributes: (attrs: Record<string, any>) => void;
  wrapAction: (action: () => void) => void;
}>();
const targetPageId = computed(() => {
  const linkedObjectId = props.nodeAttributes?.props?.linkedObjectId;
  if (linkedObjectId && linkedObjectId.value) {
    return linkedObjectId.value;
  }
  return "-1";
});

const title = ref("");
const path = ref("");
const type = ref("");

const icon: Ref<Icon> = ref({
  type: "default",
  name: "error",
});
const isLoading = ref(true);

watchEffect(async () => {
  const id = targetPageId.value;

  if (!id || id === "-1") {
    title.value = "Select realted object";
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    const res = await objectStore.getMetaInfo(id);
    if (!res) {
      title.value = "Not found";
      return;
    }
    let _icon: Icon = {
      type: "default",
      name: "error",
    };

    if (res.typeId) {
      const _res = await typeStore.cachedTypeIcons.get(res.typeId);
      if (_res) {
        _icon = _res;
      }
    }

    title.value = res.title ?? "Unknown title";
    path.value = res.path ?? "Unknown path";
    type.value = res.type ?? "Unknown type";
    icon.value = res.icon ?? _icon;
  } catch (error) {
    console.error("Page is not exist:", error);
    title.value = "Not found";
  } finally {
    isLoading.value = false;
  }
});

const openPage = () => {
  const targetId = targetPageId.value;
  if (targetId && targetId !== "-1") {
    navigation.openPage(targetId);
  }
};
</script>
