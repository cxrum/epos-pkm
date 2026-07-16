<template>
  <div
    class="surface-editor-card flex flex-col gap-3 p-4 cursor-pointer"
    contenteditable="false"
    @click="wrapAction(openPage)"
  >
    <div v-if="isLoading">Loading...</div>

    <template v-else>
      <div class="flex items-start gap-2">
        <p
          v-if="questionWord && questionWord !== 'None'"
          class="px-2 py-0.5 bg-(--hover) rounded-md"
        >
          {{ questionWord }}
        </p>
        <p v-if="questionMsg && questionMsg !== 'None'" class="pt-0.5">
          {{ questionMsg }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <BaseIcon size="24px" class="opacity-80">
          <DynamicIcon :icon="icon" />
        </BaseIcon>

        <div class="flex flex-col flex-1 min-w-0">
          <div class="flex justify-between items-center gap-2">
            <p class="font-semibold">{{ title }}</p>
            <label class="rounded whitespace-nowrap">
              {{ type }}
            </label>
          </div>
          <label class="truncate mt-0.5">{{ path }}</label>
        </div>
      </div>
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

const questionWord = computed(() => {
  const questionWord = props.nodeAttributes?.props?.questionWord;
  if (questionWord && questionWord.value) {
    return questionWord.value;
  }
  return "None";
});
const questionMsg = computed(() => {
  const questionMsg = props.nodeAttributes?.props?.arrowedQuestion;
  if (questionMsg && questionMsg.value) {
    return questionMsg.value;
  }
  return "None";
});

const icon: Ref<Icon> = ref({
  type: "default",
  name: "error",
});
const isLoading = ref(true);

watchEffect(async () => {
  const id = targetPageId.value;

  if (!id || id === "-1") {
    title.value = "Link error";
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
  if (targetId) {
    navigation.openPage(targetId);
  }
};
</script>
