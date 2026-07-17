<script setup lang="ts">
import AuthForm from "@/shared/components/auth/AuthForm.vue";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  authenticated: [];
}>();
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-110 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          class="w-full max-w-lg rounded-xl surface-dialog p-8"
          role="dialog"
          aria-modal="true"
        >
          <AuthForm
            eyebrow="Account access"
            subtitle="Use your account to enable sync."
            @authenticated="emit('authenticated')"
          />
        </div>
      </div>
    </transition>
  </Teleport>
</template>
