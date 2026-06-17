<template>
  <div class="page-link-card">This type doesnt exist: {{ title }}</div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  nodeAttributes: Record<string, any>;
}>();
console.log(props.nodeAttributes);

const title = computed(() => props.nodeAttributes.typeId);
</script>
