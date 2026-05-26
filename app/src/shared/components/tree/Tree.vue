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
      v-for="node in controller.nodes.value" 
      :key="node.id"
      :node="node"
      :controller="controller" 
      :layer="0"
    />
  </ul>
</template>