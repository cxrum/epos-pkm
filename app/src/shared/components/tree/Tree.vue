<script setup lang="ts">
import BaseTreeItem from './TreeItem.vue'
import type { TreeControllerContract } from './contract'

const props = defineProps<{
  controller: TreeControllerContract
}>()


</script>

<template>
  
  <ul class="tree-root">
    <BaseTreeItem 
      :key="controller.rootNode.value.id"
      :node="controller.rootNode.value"
      :controller="controller" 
      :layer="0"
    />
  </ul>
</template>