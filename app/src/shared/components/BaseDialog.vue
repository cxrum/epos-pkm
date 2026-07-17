<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    open: boolean;
    contentClass?: string;
  }>(),
  {
    contentClass: "max-w-md",
  },
);

const emit = defineEmits<{
  close: [];
}>();

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.open) {
    emit("close");
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          v-bind="$attrs"
          :class="['w-full rounded-2xl border p-4 shadow-2xl', contentClass]"
          role="dialog"
          aria-modal="true"
        >
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
