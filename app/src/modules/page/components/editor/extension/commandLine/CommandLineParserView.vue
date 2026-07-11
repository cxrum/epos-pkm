<template>
  <div class="command-menu">
    <button
      v-for="(item, index) in items"
      :key="index"
      :class="{ 'is-selected': index === selectedIndex }"
      @mouseenter="onHover(index)"
      @click="onClick(index)"
    >
      {{ item.title }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CommandType } from "./commandLineControllerContract";

const props = defineProps<{
  items: CommandType[];
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
</style>
