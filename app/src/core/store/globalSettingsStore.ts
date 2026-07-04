import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { appStateRepository } from "../di/global";
import type { SettingsCategory, SettingEntry } from "../types";

export const SYNC_SERVER_URL_SETTING_ID = "core.syncServerUrl";

function createSettingsSchema(): SettingsCategory[] {
  return [
    {
      id: "core.category.general",
      pluginId: "core",
      label: "General Settings",
      settingEntries: [
        {
          id: "core.autoSave",
          pluginId: "core",
          label: "Auto Save",
          description: "Automatically save pages every 30 seconds",
          type: "boolean",
          value: true,
        },
      ],
    },
    {
      id: "core.category.sync",
      pluginId: "core",
      label: "Sync",
      settingEntries: [
        {
          id: SYNC_SERVER_URL_SETTING_ID,
          pluginId: "core",
          label: "Sync Server URL",
          description:
            "Leave empty to use the standard sync server configured by the app.",
          type: "text",
          inputType: "url",
          placeholder: "http://localhost:8000",
          value: "",
        },
      ],
    },
    {
      id: "core.category.appearance",
      pluginId: "core",
      label: "Appearance",
      settingEntries: [
        {
          id: "core.theme",
          pluginId: "core",
          label: "App Theme",
          type: "select",
          value: "dark",
          options: [
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
          ],
        },
      ],
    },
    {
      id: "core.category.user",
      pluginId: "core",
      label: "User",
      settingEntries: [
        {
          id: "core.username",
          pluginId: "core",
          label: "Username",
          type: "text",
          value: "dark",
        },
      ],
    },
  ];
}

export const useGlobalSettingsStore = defineStore("global-settings", () => {
  const loadedSettingsSchema = ref<SettingsCategory[]>(createSettingsSchema());
  const isLoading = ref(false);

  const categories = computed(() =>
    loadedSettingsSchema.value.map((category) => ({
      id: category.id,
      label: category.label,
    })),
  );

  const settingsByCategory = (categoryId: string): SettingEntry[] => {
    const category = loadedSettingsSchema.value.find((c) => c.id === categoryId);
    return category?.settingEntries || [];
  };

  const loadSettings = async () => {
    isLoading.value = true;
    try {
      const config = await appStateRepository.hotReload();
      const syncUrl =
        config.customSyncServerUrl?.trim().replace(/\/+$/, "") ?? "";
      const syncSetting = loadedSettingsSchema.value
        .flatMap((category) => category.settingEntries)
        .find((entry) => entry.id === SYNC_SERVER_URL_SETTING_ID);

      if (syncSetting) {
        syncSetting.value = syncUrl;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const updateSetting = async (
    categoryId: string,
    id: string,
    newValue: unknown,
  ) => {
    const category = loadedSettingsSchema.value.find((s) => s.id === categoryId);
    const setting = category?.settingEntries.find((e) => e.id === id);

    if (!setting) {
      return;
    }

    setting.value = newValue;

    if (id === SYNC_SERVER_URL_SETTING_ID) {
      const url = typeof newValue === "string" ? newValue.trim() : "";
      const persistedUrl = await appStateRepository.setSyncServerUrl(
        url.length ? url : null,
      );
      setting.value = url.length ? persistedUrl : "";
    }
  };

  return {
    categories,
    isLoading,
    settingsByCategory,
    loadSettings,
    updateSetting,
  };
});
