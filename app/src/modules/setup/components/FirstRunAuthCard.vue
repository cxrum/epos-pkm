<script setup lang="ts">
import { computed, ref } from "vue";
import BaseButton from "@/shared/components/BaseButton.vue";
import BaseCheckbox from "@/shared/components/BaseCheckbox.vue";
import BaseDialog from "@/shared/components/BaseDialog.vue";
import { useAuthStore } from "@/core/store/authStore";
import AuthForm from "@/shared/components/auth/AuthForm.vue";

const authStore = useAuthStore();
const shouldShowAuthPrompt = computed(() => {
  const authState = authStore.authState;

  if (!authState) {
    return true;
  }

  return (
    !authStore.authPromptDismissed &&
    !authState.authenticated &&
    !authState.skipPrompt
  );
});
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h2>Synchronization</h2>
      <label>
        Connect an account to sync across devices, or continue in local-only
        mode.
      </label>
    </div>

    <div class="flex flex-col gap-4">
      <template v-if="shouldShowAuthPrompt">
        <AuthForm subtitle="Sign in to enable cross-device data sync." />
      </template>

      <div v-else class="flex flex-col gap-2">
        <h2 v-if="authStore.authState?.authenticated">Account connected</h2>
        <h2 v-else>Local mode</h2>

        <label v-if="authStore.authState?.authenticated">
          Connected as {{ authStore.authState?.user?.email }}.
        </label>
        <label v-else-if="authStore.authState?.skipPrompt">
          Authorization was skipped. Cross-device data sync remains unavailable.
        </label>
        <label v-else>
          Authorization was deferred for this session. You can continue working
          locally.
        </label>
      </div>
    </div>
  </section>
</template>
