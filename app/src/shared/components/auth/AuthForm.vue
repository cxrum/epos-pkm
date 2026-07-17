<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import BaseButton from "@/shared/components/BaseButton.vue";
import BaseCheckbox from "@/shared/components/BaseCheckbox.vue";
import BaseInput from "@/shared/components/BaseInput.vue";
import { useAuthStore } from "@/core/store/authStore";
import { useAuthSyncServerUrl } from "./useAuthSyncServerUrl";

type AuthMode = "login" | "register";

const props = withDefaults(
  defineProps<{
    eyebrow?: string;
    subtitle?: string;
  }>(),
  {
    eyebrow: "",
    subtitle: "",
  },
);

const emit = defineEmits<{
  authenticated: [];
}>();

const authStore = useAuthStore();
const mode = ref<AuthMode>("login");
const email = ref("");
const password = ref("");
const rememberFor30Days = ref(true);
const localError = ref<string | undefined>(undefined);
const {
  syncServerUrl,
  isLoading: isSyncServerLoading,
  errorMsg: syncServerUrlError,
  authAvailable,
  load: loadSyncServerState,
  updateSyncServerUrl,
} = useAuthSyncServerUrl();

const title = computed(() =>
  mode.value === "login" ? "Welcome back" : "Create account",
);

const formLabel = computed(() =>
  mode.value === "login" ? "Log in" : "Register",
);

const isSubmitDisabled = computed(
  () =>
    authStore.isLoading || isSyncServerLoading.value || !authAvailable.value,
);

const statusMessage = computed(() => {
  if (!authAvailable.value) {
    return "Local-only mode is active until you set a sync server URL. Authorization and sync stay unavailable while this field is empty.";
  }

  return `${formLabel.value} to keep your account and sync state in the cloud.`;
});

const resetErrors = () => {
  localError.value = undefined;
  authStore.clearErrorMsg();
  authStore.clearNoticeMsg();
};

watch(mode, () => {
  resetErrors();
});

watch(syncServerUrl, () => {
  resetErrors();
});

onMounted(() => {
  void loadSyncServerState();
});

const handleSyncServerUrlChange = async (nextUrl: string | number) => {
  await updateSyncServerUrl(String(nextUrl));
};

const submit = async () => {
  resetErrors();

  if (!authAvailable.value) {
    localError.value = "Set the sync server URL before signing in.";
    return;
  }

  if (!email.value.trim() || !password.value.trim()) {
    localError.value = "Email and password are required.";
    return;
  }

  const payload = {
    email: email.value.trim(),
    password: password.value,
    rememberFor30Days: rememberFor30Days.value,
  };

  const result =
    mode.value === "login"
      ? await authStore.login(payload)
      : await authStore.register(payload);

  if (result?.authenticated) {
    emit("authenticated");
  }
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="eyebrow || subtitle" class="flex flex-col gap-4">
      <span class="flex flex-col">
        <h2>{{ title }}</h2>
        <label v-if="subtitle">{{ subtitle }}</label>
      </span>
      <div class="flex flex-row gap-2">
        <BaseButton
          :variant="mode === 'login' ? 'accent' : 'secondary'"
          class="w-full"
          @click="mode = 'login'"
        >
          Login
        </BaseButton>
        <BaseButton
          :variant="mode === 'register' ? 'accent' : 'secondary'"
          class="w-full"
          @click="mode = 'register'"
        >
          Register
        </BaseButton>
      </div>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <BaseInput
        :model-value="syncServerUrl"
        autocomplete="url"
        class="w-full"
        label="Server URL"
        description="Leave this empty to stay in local-only mode. Set a server URL to
        enable authorization and sync."
        placeholder="http://localhost:8000"
        type="url"
        @update:modelValue="handleSyncServerUrlChange"
      />

      <BaseInput
        v-model="email"
        autocomplete="email"
        class="w-full"
        label="Email"
        placeholder="name@example.com"
        type="email"
      />

      <BaseInput
        v-model="password"
        autocomplete="current-password"
        class="w-full"
        label="Password"
        placeholder="••••••••"
        type="password"
      />

      <BaseCheckbox v-model="rememberFor30Days" label="Remember for 30 days" />

      <label v-if="authStore.secureStorageAvailable === false">
        This device cannot securely store login tokens. If you keep this
        checked, the app will keep you signed in only for this session.
      </label>

      <div class="flex flex-col gap-2">
        <label v-if="localError" class="text-(--text-error-color)">
          {{ localError }}
        </label>
        <label v-else-if="syncServerUrlError" class="text-(--text-error-color)">
          {{ syncServerUrlError }}
        </label>
        <label v-else-if="authStore.errorMsg" class="text-(--text-error-color)">
          {{ authStore.errorMsg }}
        </label>
        <label v-else-if="authStore.noticeMsg">
          {{ authStore.noticeMsg }}
        </label>
        <label v-else class="text-(--text-secondary-color)">
          {{ statusMessage }}
        </label>
      </div>

      <BaseButton
        :variant="'accent'"
        class="w-32 self-end"
        :disabled="isSubmitDisabled"
        type="submit"
        align="center"
      >
        {{ formLabel }}
      </BaseButton>
    </form>
  </div>
</template>
