<template>
  <div class="command-menu">
    <button
      v-for="(item, index) in items"
      :key="index"
      :class="{ 'is-selected': index === selectedIndex }"
      @click="selectItem(index)"
    >
      {{ item.title }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { CommandType } from "./commandLineControllerContract";

const props = defineProps<{
  items: CommandType[];
  command: (item: CommandType) => void;
}>();

const selectedIndex = ref(0);

watch(
  () => props.items,
  () => {
    selectedIndex.value = 0;
  },
);

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "ArrowUp") {
    selectedIndex.value =
      (selectedIndex.value + props.items.length - 1) % props.items.length;
    return true;
  }

  if (event.key === "ArrowDown") {
    selectedIndex.value = (selectedIndex.value + 1) % props.items.length;
    return true;
  }

  if (event.key === "Enter") {
    selectItem(selectedIndex.value);
    return true;
  }

  return false;
};

const selectItem = (index: number) => {
  const item = props.items[index];
  if (item) {
    props.command(item);
  }
};

defineExpose({
  onKeyDown,
});
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
