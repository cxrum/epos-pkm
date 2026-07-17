import { computed, ref } from "vue";
import { appStateRepository as defaultAppStateRepository } from "@/core/di/global";

type SyncServerRepository = Pick<
  typeof defaultAppStateRepository,
  "hotReload" | "setSyncServerUrl"
>;

export const normalizePersistedSyncServerUrl = (
  url: string | null | undefined,
) => url?.trim().replace(/\/+$/, "") ?? "";

export function useAuthSyncServerUrl(
  appStateRepository: SyncServerRepository = defaultAppStateRepository,
) {
  const syncServerUrl = ref("");
  const isLoading = ref(false);
  const errorMsg = ref<string | undefined>(undefined);

  const authAvailable = computed(() => syncServerUrl.value.trim().length > 0);

  const load = async () => {
    isLoading.value = true;
    errorMsg.value = undefined;

    try {
      const config = await appStateRepository.hotReload();
      syncServerUrl.value = normalizePersistedSyncServerUrl(
        config.customSyncServerUrl,
      );
    } catch {
      errorMsg.value = "Unable to load sync server settings.";
    } finally {
      isLoading.value = false;
    }
  };

  const updateSyncServerUrl = async (nextUrl: string) => {
    syncServerUrl.value = nextUrl;
    errorMsg.value = undefined;

    try {
      const persistedUrl = await appStateRepository.setSyncServerUrl(
        nextUrl.trim().length ? nextUrl.trim() : null,
      );
      syncServerUrl.value = normalizePersistedSyncServerUrl(persistedUrl);
    } catch {
      errorMsg.value = "Unable to update the sync server URL.";
    }
  };

  return {
    syncServerUrl,
    isLoading,
    errorMsg,
    authAvailable,
    load,
    updateSyncServerUrl,
  };
}
