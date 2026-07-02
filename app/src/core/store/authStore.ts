import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, ref } from "vue";
import { AuthRepository } from "../infra/authRepository";
import type { AuthCredentials, AuthState } from "../../../authApi";

const authRepository = new AuthRepository();

export const useAuthStore = defineStore("auth", () => {
  const authState = ref<AuthState | null>(null);
  const isLoading = ref(false);
  const errorMsg = ref<string | undefined>(undefined);
  const authPromptDismissed = ref(false);

  const shouldShowAuthPrompt = computed(() => {
    if (!authState.value) {
      return true;
    }

    return (
      !authPromptDismissed.value &&
      !authState.value.authenticated &&
      !authState.value.skipPrompt
    );
  });

  const userLabel = computed(() => authState.value?.user?.email ?? undefined);

  const loadAuthState = async () => {
    isLoading.value = true;
    try {
      authState.value = await authRepository.getStatus();
      clearErrorMsg();
    } catch (error) {
      errorMsg.value = error instanceof Error ? error.message : "Failed to load auth state";
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (payload: AuthCredentials) => {
    isLoading.value = true;
    try {
      authState.value = await authRepository.login(payload);
      authPromptDismissed.value = true;
      clearErrorMsg();
      return authState.value;
    } catch (error) {
      errorMsg.value = error instanceof Error ? error.message : "Unable to log in";
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (payload: AuthCredentials) => {
    isLoading.value = true;
    try {
      authState.value = await authRepository.register(payload);
      authPromptDismissed.value = true;
      clearErrorMsg();
      return authState.value;
    } catch (error) {
      errorMsg.value = error instanceof Error ? error.message : "Unable to register";
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const skipAuth = async (neverAskAgain: boolean) => {
    isLoading.value = true;
    try {
      authState.value = await authRepository.skipAuth(neverAskAgain);
      authPromptDismissed.value = true;
      clearErrorMsg();
      return authState.value;
    } catch (error) {
      errorMsg.value = error instanceof Error ? error.message : "Unable to skip authentication";
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const clearErrorMsg = () => {
    errorMsg.value = undefined;
  };

  const reopenAuthPrompt = () => {
    authPromptDismissed.value = false;
  };

  return {
    authState,
    isLoading,
    errorMsg,
    shouldShowAuthPrompt,
    userLabel,

    loadAuthState,
    login,
    register,
    skipAuth,
    clearErrorMsg,
    reopenAuthPrompt,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
