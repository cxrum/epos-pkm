import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import { authRepository } from "../di/global";
import type { AuthCredentials, AuthState } from "../../../authApi";

export const useAuthStore = defineStore("auth", () => {
  const authState = ref<AuthState | null>(null);
  const isLoading = ref(false);
  const errorMsg = ref<string | undefined>(undefined);
  const authPromptDismissed = ref(false);

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
      return undefined;
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
      return undefined;
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
      return undefined;
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
    authPromptDismissed,

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
