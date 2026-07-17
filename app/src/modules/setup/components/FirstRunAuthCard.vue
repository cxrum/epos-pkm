<script setup lang="ts">
import { computed, ref } from "vue";
import BaseButton from "@/shared/components/BaseButton.vue";
import BaseCheckbox from "@/shared/components/BaseCheckbox.vue";
import BaseDialog from "@/shared/components/BaseDialog.vue";
import { useAuthStore } from "@/core/store/authStore";
import AuthForm from "@/shared/components/auth/AuthForm.vue";

const authStore = useAuthStore();
const skipDialogOpen = ref(false);
const neverAskAgain = ref(false);

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

const openSkipDialog = () => {
  skipDialogOpen.value = true;
  neverAskAgain.value = false;
};

const confirmSkip = async () => {
  const result = await authStore.skipAuth(neverAskAgain.value);
  if (result) {
    skipDialogOpen.value = false;
  }
};

const closeSkipDialog = () => {
  skipDialogOpen.value = false;
};
</script>

<template>
  <section
    class="surface-mid-layer flex flex-col gap-4 rounded-2xl border border-(--border) p-6 shadow-xl"
  >
    <div class="flex flex-col gap-1">
      <h2>Synchronization</h2>
      <label>
        Connect an account to sync across devices, or continue in local-only
        mode.
      </label>
    </div>

    <div class="flex flex-col gap-4">
      <template v-if="shouldShowAuthPrompt">
        <div
          class="surface-bottom-layer rounded-2xl border border-(--border) p-4"
        >
          <AuthForm
            eyebrow="First run authentication"
            subtitle="Sign in to enable cross-device data sync."
          />
        </div>

        <div
          class="surface-bottom-layer flex flex-col gap-4 rounded-2xl border border-(--border) p-4"
        >
          <div class="flex flex-col gap-1">
            <p>Skip for now</p>
            <label>
              Continue on this device without connecting an account yet.
            </label>
          </div>

          <div class="flex justify-end">
            <BaseButton
              variant="secondary"
              class="w-full sm:w-auto"
              :disabled="authStore.isLoading"
              @click="openSkipDialog"
            >
              <span class="w-20 text-center">SKIP</span>
            </BaseButton>
          </div>
        </div>
      </template>

      <div
        v-else
        class="surface-bottom-layer flex flex-col gap-3 rounded-2xl border border-(--border) p-4"
      >
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

  <BaseDialog :open="skipDialogOpen" @close="closeSkipDialog">
    <div class="flex flex-col gap-2">
      <h2>Skip authorization?</h2>
      <label>
        Without authorization, cross-device data sync is unavailable.
      </label>
    </div>

    <div class="mt-4 flex flex-col gap-4">
      <BaseCheckbox v-model="neverAskAgain" label="never ask again" />

      <div class="flex justify-end gap-2">
        <BaseButton variant="secondary" @click="closeSkipDialog">
          Cancel
        </BaseButton>
        <BaseButton
          variant="accent"
          :disabled="authStore.isLoading"
          @click="confirmSkip"
        >
          Skip
        </BaseButton>
      </div>
    </div>
  </BaseDialog>
</template>
