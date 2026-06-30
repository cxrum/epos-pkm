<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseButton from "@/shared/components/BaseButton.vue";
import BaseCheckbox from "@/shared/components/BaseCheckbox.vue";
import BaseInput from "@/shared/components/BaseInput.vue";
import { useAuthStore } from "@/core/store/authStore";

type AuthMode = "login" | "register";

const authStore = useAuthStore();

const mode = ref<AuthMode>("login");
const email = ref("");
const password = ref("");
const skipDialogOpen = ref(false);
const neverAskAgain = ref(false);
const localError = ref<string | undefined>(undefined);

const title = computed(() =>
  mode.value === "login" ? "Welcome back" : "Create account",
);

const subtitle = computed(() =>
  mode.value === "login"
    ? "Sign in to enable cross-device data sync."
    : "Create an account to sync your workspace across devices.",
);

const formLabel = computed(() =>
  mode.value === "login" ? "Log in" : "Register",
);

const switchLabel = computed(() =>
  mode.value === "login" ? "Need an account?" : "Already have an account?",
);

const switchActionLabel = computed(() =>
  mode.value === "login" ? "Register" : "Log in",
);

watch(mode, () => {
  localError.value = undefined;
  authStore.clearErrorMsg();
});

const submit = async () => {
  localError.value = undefined;
  authStore.clearErrorMsg();

  if (!email.value.trim() || !password.value.trim()) {
    localError.value = "Email and password are required.";
    return;
  }

  try {
    if (mode.value === "login") {
      await authStore.login({
        email: email.value.trim(),
        password: password.value,
      });
    } else {
      await authStore.register({
        email: email.value.trim(),
        password: password.value,
      });
    }
  } catch {
    // Store already carries the server error message.
  }
};

const openSkipDialog = () => {
  skipDialogOpen.value = true;
  neverAskAgain.value = false;
};

const confirmSkip = async () => {
  try {
    await authStore.skipAuth(neverAskAgain.value);
    skipDialogOpen.value = false;
  } catch {
    // Store already carries the server error message.
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
      <template v-if="authStore.shouldShowAuthPrompt">
        <div class="flex flex-col gap-2">
          <span
            class="text-xs uppercase tracking-[0.28em] text-(--text-secondary-color)"
          >
            First run authentication
          </span>
          <h2>{{ title }}</h2>
          <label>{{ subtitle }}</label>
        </div>

        <div
          class="grid gap-2 rounded-xl border border-(--border) bg-black/10 p-1 sm:grid-cols-2"
        >
          <BaseButton
            :variant="mode === 'login' ? 'accent' : 'default'"
            class="w-full"
            @click="mode = 'login'"
          >
            Login
          </BaseButton>
          <BaseButton
            :variant="mode === 'register' ? 'accent' : 'default'"
            class="w-full"
            @click="mode = 'register'"
          >
            Register
          </BaseButton>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <BaseInput
            v-model="email"
            autocomplete="email"
            label="Email"
            placeholder="name@example.com"
            type="email"
          />

          <BaseInput
            v-model="password"
            autocomplete="current-password"
            label="Password"
            placeholder="••••••••"
            type="password"
          />

          <div class="flex flex-col gap-2">
            <p v-if="localError" class="text-(--text-error-color)">
              {{ localError }}
            </p>
            <p v-else-if="authStore.errorMsg" class="text-(--text-error-color)">
              {{ authStore.errorMsg }}
            </p>

            <p v-else class="text-(--text-secondary-color)">
              {{ formLabel }} to keep your account and sync state in the cloud.
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <BaseButton
              :variant="'accent'"
              class="w-full sm:w-auto"
              :disabled="authStore.isLoading"
              type="submit"
            >
              <span class="w-20 text-center">{{ formLabel }}</span>
            </BaseButton>

            <BaseButton
              variant="secondary"
              class="w-full sm:w-auto"
              :disabled="authStore.isLoading"
              @click="openSkipDialog"
            >
              <span class="w-20 text-center">SKIP</span>
            </BaseButton>

            <span class="sm:ml-auto text-sm text-(--text-secondary-color)">
              {{ switchLabel }}
              <button
                class="ml-1 text-(--text-default-color) underline underline-offset-4"
                type="button"
                @click="mode = mode === 'login' ? 'register' : 'login'"
              >
                {{ switchActionLabel }}
              </button>
            </span>
          </div>
        </form>
      </template>

      <div
        v-else
        class="flex flex-col gap-3 rounded-2xl border border-(--border) bg-black/10 p-4"
      >
        <h2 v-if="authStore.authState?.authenticated">Account connected</h2>
        <h2 v-else>Local mode</h2>

        <label v-if="authStore.authState?.authenticated">
          Connected as {{ authStore.userLabel }}.
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

    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="skipDialogOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
        >
          <div
            class="w-full max-w-md rounded-2xl border border-(--border) bg-(--surface-layer) p-6 shadow-2xl"
          >
            <div class="flex flex-col gap-2">
              <h2>Skip authorization?</h2>
              <label>
                Without authorization, cross-device data sync is unavailable.
              </label>
            </div>

            <div class="mt-4 flex flex-col gap-4">
              <BaseCheckbox
                v-model="neverAskAgain"
                label="never ask again"
              />

              <div class="flex gap-2 justify-end">
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
          </div>
        </div>
      </transition>
    </Teleport>
  </section>
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
