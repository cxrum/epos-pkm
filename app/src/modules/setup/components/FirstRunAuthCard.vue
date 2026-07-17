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
    class="relative overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(160deg,rgba(64,65,66,0.88),rgba(34,35,36,0.98))] shadow-2xl"
  >
    <div class="absolute inset-0 pointer-events-none opacity-60">
      <div
        class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(37,122,136,0.35)_0%,rgba(37,122,136,0.0)_72%)] blur-2xl"
      ></div>
      <div
        class="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.0)_70%)] blur-2xl"
      ></div>
    </div>

    <div class="relative flex flex-col gap-4 p-6">
      <template v-if="shouldShowAuthPrompt">
        <AuthForm
          eyebrow="First run authentication"
          subtitle="Sign in to enable cross-device data sync."
        />

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
      </template>

      <div
        v-else
        class="flex flex-col gap-3 rounded-2xl border border-(--border) bg-black/10 p-4"
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
  </section>
</template>
