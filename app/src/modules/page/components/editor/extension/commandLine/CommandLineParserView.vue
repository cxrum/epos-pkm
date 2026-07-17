<template>
  <div
    ref="listRef"
    class="surface-shadow surface-dialog surface-command-line scroll"
  >
    <button
      v-for="(item, index) in items"
      :key="index"
      :class="index === selectedIndex ? 'active' : ''"
      class="base-button"
      @mouseenter="onHover(index)"
      @click="onClick(index)"
    >
      <BaseIcon size="24px">
        <DynamicIcon :icon="globalTypeStore.cachedTypeIcons.get(item.typeId)" />
      </BaseIcon>
      <span
        v-for="(chunk, i) in formatTitle(item.title, item.matchIndices.title)"
        :key="i"
        :class="{ highlight: chunk.isMatch }"
        >{{ chunk.text }}</span
      >
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type {
  CommandType,
  FilteredCommandType,
} from "./commandLineControllerContract";
import { useGlobalTypeStore } from "@/core/store/globalTypeStore";
import BaseIcon from "@/shared/components/icon/BaseIcon.vue";
import DynamicIcon from "@/shared/components/icon/DynamicIcon.vue";

const props = defineProps<{
  items: FilteredCommandType[];
  command: (item: CommandType) => void;
  selectedIndex: number;
  onUpdateIndex: (index: number) => void;
}>();

const globalTypeStore = useGlobalTypeStore();

const listRef = ref<HTMLElement | null>(null);

watch(
  () => props.selectedIndex,
  async (newIndex) => {
    await nextTick();

    const container = listRef.value;
    if (!container) return;

    const activeElement = container.children[newIndex] as HTMLElement;
    if (!activeElement) return;

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    const elemTop = activeElement.offsetTop;
    const elemBottom = elemTop + activeElement.offsetHeight;

    if (elemTop < containerTop) {
      container.scrollTop = elemTop;
    } else if (elemBottom > containerBottom) {
      container.scrollTop = elemBottom - container.clientHeight;
    }
  },
);

const onHover = (index: number) => {
  props.onUpdateIndex(index);
};

const onClick = (index: number) => {
  const item = props.items[index];
  if (item) {
    props.command(item);
  }
};

const formatTitle = (text: string, indices: [number, number][]) => {
  if (!indices || indices.length === 0) {
    return [{ text, isMatch: false }];
  }

  const result: { text: string; isMatch: boolean }[] = [];
  let currentIndex = 0;

  for (const [start, end] of indices) {
    if (start > currentIndex) {
      result.push({ text: text.slice(currentIndex, start), isMatch: false });
    }
    result.push({ text: text.slice(start, end), isMatch: true });
    currentIndex = end;
  }

  if (currentIndex < text.length) {
    result.push({ text: text.slice(currentIndex), isMatch: false });
  }

  return result;
};
</script>

<style scoped>
.highlight {
  color: var(--text-highlight-color);
}
</style>
