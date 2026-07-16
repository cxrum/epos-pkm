<template>
  <div class="surface-latex-block">
    <div v-if="!isSelected" class="preview" v-html="renderedMath"></div>

    <div :class="['editor', { 'is-hidden': !isSelected }]">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import katex from "katex";
import type { Node } from "@tiptap/pm/model";

const props = defineProps<{
  node: Node;
  isSelected: boolean;
  nodeAttributes: Record<string, any>;
  updateAttributes: (attrs: Record<string, any>) => void;
}>();

const renderedMath = computed(() => {
  const text = props.node.textContent || "";

  if (!text) {
    return katex.renderToString("\\text{Empty LaTeX block}", {
      displayMode: true,
      throwOnError: false,
    });
  }

  try {
    return katex.renderToString(text, {
      displayMode: true,
      throwOnError: false,
    });
  } catch {
    return text;
  }
});
</script>
