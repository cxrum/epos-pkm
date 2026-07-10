import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const { appStateRepositoryMock } = vi.hoisted(() => ({
  appStateRepositoryMock: {
    hotReload: vi.fn(),
    setSyncServerUrl: vi.fn(),
  },
}));

vi.mock("@/core/di/global", () => ({
  appStateRepository: appStateRepositoryMock,
}));

import { useGlobalSettingsStore } from "@/core/store/globalSettingsStore";

describe("useGlobalSettingsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("loads the current sync server url into settings", async () => {
    appStateRepositoryMock.hotReload.mockResolvedValue({
      workspacesRootPath: "",
      selectedWorkspace: "",
      customSyncServerUrl: "https://sync.example.com",
    });

    const store = useGlobalSettingsStore();
    await store.loadSettings();

    const syncSetting = store
      .settingsByCategory("core.category.sync")
      .find((setting) => setting.id === "core.syncServerUrl");

    expect(syncSetting?.value).toBe("https://sync.example.com");
  });

  it("persists a custom sync server url and clears it when the field is emptied", async () => {
    appStateRepositoryMock.hotReload.mockResolvedValue({
      workspacesRootPath: "",
      selectedWorkspace: "",
      customSyncServerUrl: null,
    });
    appStateRepositoryMock.setSyncServerUrl.mockResolvedValue(
      "https://sync.example.com",
    );

    const store = useGlobalSettingsStore();
    await store.loadSettings();

    await store.updateSetting(
      "core.category.sync",
      "core.syncServerUrl",
      "https://sync.example.com/",
    );

    expect(appStateRepositoryMock.setSyncServerUrl).toHaveBeenLastCalledWith(
      "https://sync.example.com/",
    );

    const syncSetting = store
      .settingsByCategory("core.category.sync")
      .find((setting) => setting.id === "core.syncServerUrl");
    expect(syncSetting?.value).toBe("https://sync.example.com");

    appStateRepositoryMock.setSyncServerUrl.mockResolvedValue("http://default");

    await store.updateSetting("core.category.sync", "core.syncServerUrl", "");

    expect(appStateRepositoryMock.setSyncServerUrl).toHaveBeenLastCalledWith(
      null,
    );
    expect(syncSetting?.value).toBe("");
  });
});
