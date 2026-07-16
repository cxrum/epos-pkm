import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import { authRepository } from "../di/global";
import type { AuthCredentials, AuthState } from "../../../authApi";
import { formatAuthError } from "../infra/authError";

export const useAuthStore = defineStore("auth", () => {
  const authState = ref<AuthState | null>(null);
  const secureStorageAvailable = ref<boolean | null>(null);
  const isLoading = ref(false);
  const errorMsg = ref<string | undefined>(undefined);
  const noticeMsg = ref<string | undefined>(undefined);
  const authPromptDismissed = ref(false);

  const resolveSecureStorageAvailability = async () => {
    if (secureStorageAvailable.value !== null) {
      return secureStorageAvailable.value;
    }

    secureStorageAvailable.value = await authRepository.canPersistSession();
    return secureStorageAvailable.value;
  };

  const loadAuthState = async () => {
    isLoading.value = true;
    try {
      secureStorageAvailable.value = await authRepository.canPersistSession();
      authState.value = await authRepository.getStatus();
      clearErrorMsg();
    } catch (error) {
      errorMsg.value = formatAuthError(
        error,
        "Failed to load auth state",
      );
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (payload: AuthCredentials) => {
    isLoading.value = true;
    try {
      const rememberFor30Days = payload.rememberFor30Days ?? true;
      authState.value = await authRepository.login(payload);
      authPromptDismissed.value = true;
      clearErrorMsg();
      clearNoticeMsg();

      const canPersistSession = await resolveSecureStorageAvailability();

      if (!rememberFor30Days) {
        noticeMsg.value = "Signed in for this session only.";
      } else if (canPersistSession === false) {
        noticeMsg.value =
          "You are signed in for this session only because secure storage is unavailable. Install and unlock a keyring provider such as GNOME Keyring or KWallet to remember sign-ins for 30 days.";
      }
      return authState.value;
    } catch (error) {
      errorMsg.value = formatAuthError(error, "Unable to log in");
      return undefined;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (payload: AuthCredentials) => {
    isLoading.value = true;
    try {
      const rememberFor30Days = payload.rememberFor30Days ?? true;
      authState.value = await authRepository.register(payload);
      authPromptDismissed.value = true;
      clearErrorMsg();
      clearNoticeMsg();

      const canPersistSession = await resolveSecureStorageAvailability();

      if (!rememberFor30Days) {
        noticeMsg.value = "Signed in for this session only.";
      } else if (canPersistSession === false) {
        noticeMsg.value =
          "You are signed in for this session only because secure storage is unavailable. Install and unlock a keyring provider such as GNOME Keyring or KWallet to remember sign-ins for 30 days.";
      }
      return authState.value;
    } catch (error) {
      errorMsg.value = formatAuthError(error, "Unable to register");
      return undefined;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    isLoading.value = true;
    try {
      authState.value = await authRepository.logout();
      clearErrorMsg();
      clearNoticeMsg();
      return authState.value;
    } catch (error) {
      errorMsg.value = formatAuthError(error, "Unable to log out");
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
      clearNoticeMsg();
      return authState.value;
    } catch (error) {
      errorMsg.value = formatAuthError(
        error,
        "Unable to skip authentication",
      );
      return undefined;
    } finally {
      isLoading.value = false;
    }
  };

  const clearErrorMsg = () => {
    errorMsg.value = undefined;
  };

  const clearNoticeMsg = () => {
    noticeMsg.value = undefined;
  };

  const reopenAuthPrompt = () => {
    authPromptDismissed.value = false;
  };

  return {
    authState,
    secureStorageAvailable,
    isLoading,
    errorMsg,
    noticeMsg,
    authPromptDismissed,

    loadAuthState,
    login,
    register,
    logout,
    skipAuth,
    clearErrorMsg,
    clearNoticeMsg,
    reopenAuthPrompt,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
