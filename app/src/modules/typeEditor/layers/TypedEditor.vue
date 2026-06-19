<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const props = defineProps();
const route = useRoute();

const typeId = computed(() => route.params.id);
</script>

<template>
  <div class="page">{{ typeId }}</div>
</template>

<style lang="css" scoped>
.page {
  padding-left: clamp(16px, 8vw, 128px);
  padding-right: clamp(16px, 8vw, 128px);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}
</style>
