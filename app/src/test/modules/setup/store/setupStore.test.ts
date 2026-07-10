import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const { appStateRepositoryMock } = vi.hoisted(() => ({
  appStateRepositoryMock: {
    getWorkspaces: vi.fn(),
    getLocalWorkspace: vi.fn(),
    getWorkspacesRootPath: vi.fn(),
    selectWorkspacesRoot: vi.fn(),
    clearSelectedWorkspace: vi.fn(),
    createWorkspace: vi.fn(),
    selectWorkspace: vi.fn(),
  },
}));

vi.mock("@/core/di/global", () => ({
  appStateRepository: appStateRepositoryMock,
}));

import { useSetupStore } from "@/modules/setup/store/setupStore";

describe("useSetupStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("loads workspace entries with relative paths", async () => {
    appStateRepositoryMock.getWorkspacesRootPath.mockResolvedValue(
      "/home/user/Epos/Workspaces",
    );
    appStateRepositoryMock.getWorkspaces.mockResolvedValue([
      { id: "workspace-a", relativePath: "projects/a" },
      { id: "workspace-b", relativePath: "projects/b" },
    ]);
    appStateRepositoryMock.getLocalWorkspace.mockImplementation(
      async (id: string) => ({
        id,
        title: id === "workspace-a" ? "Alpha" : "Beta",
      }),
    );

    const store = useSetupStore();
    await store.loadWorkspaces();

    expect(store.workspaces).toEqual([
      { id: "workspace-a", title: "Alpha", relativePath: "projects/a" },
      { id: "workspace-b", title: "Beta", relativePath: "projects/b" },
    ]);
    expect(store.workspacesRootPath).toBe("/home/user/Epos/Workspaces");
  });

  it("creates a focused untitled draft workspace row and removes it on cancel", async () => {
    const store = useSetupStore();

    store.beginWorkspaceDraft();
    expect(store.draftWorkspaces).toHaveLength(1);
    expect(store.draftWorkspaces[0]?.title).toBe("Untitled");

    store.cancelWorkspaceDraft(store.draftWorkspaces[0]!.id);
    expect(store.draftWorkspaces).toHaveLength(0);
  });
});
