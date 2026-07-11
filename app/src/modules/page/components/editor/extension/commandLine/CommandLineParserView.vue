<template>
  <div class="command-menu">
    <button
      v-for="(item, index) in items"
      :key="index"
      :class="{ 'is-selected': index === selectedIndex }"
      @mouseenter="onHover(index)"
      @click="onClick(index)"
    >
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
import type {
  CommandType,
  FilteredCommandType,
} from "./commandLineControllerContract";

const props = defineProps<{
  items: FilteredCommandType[];
  command: (item: CommandType) => void;
  selectedIndex: number;
  onUpdateIndex: (index: number) => void;
}>();

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
.command-menu {
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  min-width: 150px;
}
.command-menu button {
  padding: 8px;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 2px;
}
.command-menu button.is-selected {
  background: #f0f0f0;
}
.highlight {
  font-weight: 600;
  color: #3b82f6;
}
</style>
