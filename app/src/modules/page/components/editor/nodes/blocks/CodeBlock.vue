<template>
  <NodeViewWrapper>
    <div class="code-block surface-content-code-block relative">
      <p class="absolute top-2 right-3 text-xs opacity-50 m-0 pointer-events-none">{{ language }}</p>
      <pre><NodeViewContent 
        as="code"
        :class="`language-${language}`"
        /></pre>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { nodeViewProps, NodeViewContent, NodeViewWrapper } from "@tiptap/vue-3";
import { EditorControllerKey } from "../../contract.ts";


const props = defineProps(nodeViewProps);
const controller = inject(EditorControllerKey);


const language = computed(()=>{
  return props.node.attrs.language ?? "plaintext"
})

const isSelected = computed(() => {
  return controller?.focusedObjectId.value === props.node.attrs.id;
});
</script>

<style lang="css" scoped>
.tiptap pre code .hljs {
  background: transparent !important;
  padding: 0 !important;
}
</style>