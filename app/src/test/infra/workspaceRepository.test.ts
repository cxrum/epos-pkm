import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { MockFileSystem } from "./mockFileSystem";
import type { WorkspaceLocalConfigEntity } from "@/core/domain/workspace";
import { WorkspaceStateRepository } from "@/core/infra/workspaceRepository";

describe("WorkspaceStateRepository", () => {
  let mockFs: MockFileSystem<WorkspaceLocalConfigEntity>;

  beforeEach(() => {
    mockFs = new MockFileSystem<WorkspaceLocalConfigEntity>();
    vi.stubGlobal("window", {
      electronFs: mockFs,
      appState: {
        getSelectedWorkspace: vi.fn().mockResolvedValue({
          id: "workspace-1",
          title: "Workspace",
          relativePath: "workspaces/team-a",
        }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and saves workspace state under the selected relative path", async () => {
    await mockFs.save("workspaces/team-a/.workspace", {
      id: "workspace-1",
      title: "Workspace",
      state: {
        savedTabs: [],
      },
    } as WorkspaceLocalConfigEntity);

    const repository = new WorkspaceStateRepository(
      () => window.appState.getSelectedWorkspace(),
    );

    const loaded = await repository.load();
    expect(loaded.id).toBe("workspace-1");
    expect(loaded.title).toBe("Workspace");
    expect(loaded.state.savedTabs).toEqual([]);

    await repository.saveLastActiveTab({ id: "page-1", kind: "sys:workspace" });

    const saved = await mockFs.get("workspaces/team-a/.workspace");
    expect(saved?.state.lastActiveTab).toEqual({
      id: "page-1",
      kind: "sys:workspace",
    });
  });
});
