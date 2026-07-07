<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseButton from "@/shared/components/BaseButton.vue";
import BaseCheckbox from "@/shared/components/BaseCheckbox.vue";
import BaseInput from "@/shared/components/BaseInput.vue";
import { useAuthStore } from "@/core/store/authStore";

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

const title = computed(() =>
    mode.value === "login" ? "Welcome back" : "Create account",
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

const resetErrors = () => {
    localError.value = undefined;
    authStore.clearErrorMsg();
    authStore.clearNoticeMsg();
};

watch(mode, () => {
    resetErrors();
});

const submit = async () => {
    resetErrors();

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
        <div v-if="eyebrow || subtitle" class="flex flex-col gap-2">
            <span
                v-if="eyebrow"
                class="text-xs uppercase tracking-[0.28em] text-(--text-secondary-color)"
            >
                {{ eyebrow }}
            </span>
            <h2>{{ title }}</h2>
            <label v-if="subtitle">{{ subtitle }}</label>
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

            <BaseCheckbox
                v-model="rememberFor30Days"
                label="Remember for 30 days"
            />
            <p
                v-if="authStore.secureStorageAvailable === false"
                class="text-sm text-(--text-secondary-color)"
            >
                This device cannot securely store login tokens. If you keep this
                checked, the app will keep you signed in only for this session.
            </p>

            <div class="flex flex-col gap-2">
                <p v-if="localError" class="text-(--text-error-color)">
                    {{ localError }}
                </p>
                <p
                    v-else-if="authStore.errorMsg"
                    class="text-(--text-error-color)"
                >
                    {{ authStore.errorMsg }}
                </p>
                <p
                    v-else-if="authStore.noticeMsg"
                    class="text-(--text-secondary-color)"
                >
                    {{ authStore.noticeMsg }}
                </p>
                <p v-else class="text-(--text-secondary-color)">
                    {{ formLabel }} to keep your account and sync state in the
                    cloud.
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
    </div>
</template>
