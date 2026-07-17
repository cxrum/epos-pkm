import { beforeEach, describe, expect, it, vi } from "vitest";

const { appStateRepositoryMock } = vi.hoisted(() => ({
  appStateRepositoryMock: {
    hotReload: vi.fn(),
    setSyncServerUrl: vi.fn(),
  },
}));

vi.mock("@/core/di/global", () => ({
  appStateRepository: appStateRepositoryMock,
}));

import {
  normalizePersistedSyncServerUrl,
  useAuthSyncServerUrl,
} from "@/shared/components/auth/useAuthSyncServerUrl";

describe("useAuthSyncServerUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appStateRepositoryMock.hotReload.mockResolvedValue({
      workspacesRootPath: "",
      selectedWorkspace: "",
      customSyncServerUrl: null,
    });
    appStateRepositoryMock.setSyncServerUrl.mockResolvedValue("");
  });

  it("loads the saved sync server url using settings normalization", async () => {
    appStateRepositoryMock.hotReload.mockResolvedValue({
      workspacesRootPath: "",
      selectedWorkspace: "",
      customSyncServerUrl: "https://sync.example.com///",
    });

    const state = useAuthSyncServerUrl();
    await state.load();

    expect(state.syncServerUrl.value).toBe("https://sync.example.com");
    expect(normalizePersistedSyncServerUrl("https://sync.example.com///")).toBe(
      "https://sync.example.com",
    );
  });

  it("treats an empty sync server url as local-only mode", async () => {
    const state = useAuthSyncServerUrl();
    await state.load();
    await state.updateSyncServerUrl("");

    expect(state.authAvailable.value).toBe(false);
    expect(appStateRepositoryMock.setSyncServerUrl).toHaveBeenLastCalledWith(
      null,
    );
    expect(state.syncServerUrl.value).toBe("");
  });

  it("persists the sync server url and reuses the normalized stored value", async () => {
    appStateRepositoryMock.setSyncServerUrl.mockResolvedValue(
      "https://sync.example.com",
    );

    const state = useAuthSyncServerUrl();
    await state.load();
    await state.updateSyncServerUrl("https://sync.example.com/");

    expect(state.authAvailable.value).toBe(true);
    expect(appStateRepositoryMock.setSyncServerUrl).toHaveBeenLastCalledWith(
      "https://sync.example.com/",
    );
    expect(state.syncServerUrl.value).toBe("https://sync.example.com");
  });
});
