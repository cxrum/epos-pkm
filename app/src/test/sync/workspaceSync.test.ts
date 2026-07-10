import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applySnapshotDelta,
  docToSnapshot,
  resetWorkspaceSyncState,
  runWorkspaceSyncTick,
  snapshotToDoc,
  stableSerialize,
} from "@/core/sync/workspaceSync";
import { resetCatalogSyncState } from "@/core/sync/workspaceCatalogSync";

describe("workspace sync helpers", () => {
  const localWorkspaces = [
    { id: "local-workspace-id", relativePath: "projects/a" },
  ];

  beforeEach(() => {
    resetWorkspaceSyncState();
    resetCatalogSyncState();
    localWorkspaces.splice(0, localWorkspaces.length, {
      id: "local-workspace-id",
      relativePath: "projects/a",
    });

    vi.stubGlobal("window", {
      authApi: {
        getStatus: vi.fn().mockResolvedValue({
          authenticated: true,
          user: { id: "user-1" },
        }),
        getAccessToken: vi.fn().mockResolvedValue("token"),
        getSyncKey: vi.fn().mockResolvedValue(
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        ),
      },
      appState: {
        getWorkspaces: vi.fn().mockImplementation(async () => [
          ...localWorkspaces,
        ]),
        getSelectedWorkspace: vi.fn().mockResolvedValue({
          id: "local-workspace-id",
          title: "Workspace",
          relativePath: "projects/a",
        }),
        getSyncServerUrl: vi.fn().mockResolvedValue("https://sync.example.com"),
        upsertWorkspace: vi.fn().mockImplementation(async (workspace) => {
          if (!localWorkspaces.some((item) => item.id === workspace.id)) {
            localWorkspaces.push({
              id: workspace.id,
              relativePath: workspace.id === "remote-workspace"
                ? "remote/workspace"
                : `projects/${workspace.id}`,
            });
          }
          return workspace;
        }),
      },
      electronFs: {
        join: vi.fn().mockImplementation((base: string, target: string) =>
          base ? `${base}/${target}` : target,
        ),
        relative: vi.fn().mockImplementation((from: string, to: string) =>
          to.startsWith(`${from}/`) ? to.slice(from.length + 1) : to,
        ),
        getAllFlat: vi.fn().mockResolvedValue({}),
        get: vi.fn().mockResolvedValue(undefined),
        save: vi.fn(),
        remove: vi.fn(),
        exists: vi.fn().mockResolvedValue(false),
        isDirectory: vi.fn().mockResolvedValue(false),
        list: vi.fn().mockResolvedValue([]),
        tree: vi.fn().mockResolvedValue([]),
        rename: vi.fn().mockResolvedValue(true),
        move: vi.fn().mockResolvedValue(undefined),
        parse: vi.fn(),
        renameFile: vi.fn(),
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/v1/sync/catalog/pull")) {
          return {
            ok: true,
            json: async () => ({
              updates: [
                {
                  cursor: "catalog-cursor-1",
                  workspace_id: "remote-workspace",
                  title: "Remote Workspace",
                },
              ],
            }),
          } as Response;
        }

        if (url.includes("/v1/sync/catalog/push")) {
          return {
            ok: true,
            json: async () => ({ cursor: "catalog-push-cursor-1" }),
          } as Response;
        }

        if (url.includes("/v1/sync/pull")) {
          return {
            ok: true,
            json: async () => ({ updates: [] }),
          } as Response;
        }

        if (url.includes("/v1/sync/push")) {
          return {
            ok: true,
            json: async () => ({ cursor: "sync-push-cursor-1" }),
          } as Response;
        }

        throw new Error(`Unexpected fetch call: ${url}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips snapshots through a Yjs doc", () => {
    const snapshot = {
      state: { title: "Workspace", selectedWorkspace: "abc" },
      files: {
        "workspace/root.json": { id: "-1", title: "root" },
        ".workspace": { id: "abc", title: "Workspace" },
      },
    };

    const doc = snapshotToDoc(snapshot);
    expect(docToSnapshot(doc)).toEqual(snapshot);
  });

  it("applies only changed keys from a local snapshot", () => {
    const baseSnapshot = {
      state: { title: "Workspace", selectedWorkspace: "abc" },
      files: {
        "workspace/root.json": { id: "-1", title: "root" },
        ".workspace": { id: "abc", title: "Workspace" },
      },
    };
    const currentSnapshot = {
      state: { title: "Workspace 2", selectedWorkspace: "abc" },
      files: {
        "workspace/root.json": { id: "-1", title: "root updated" },
      },
    };

    const doc = snapshotToDoc(baseSnapshot);
    const changed = applySnapshotDelta(doc, baseSnapshot, currentSnapshot);

    expect(changed).toBe(true);
    expect(docToSnapshot(doc)).toEqual(currentSnapshot);
  });

  it("serializes objects with stable key order", () => {
    expect(stableSerialize({ b: 1, a: { d: 2, c: 3 } })).toBe(
      '{"a":{"c":3,"d":2},"b":1}',
    );
  });

  it("pulls sync updates using the workspace id as workspace_id", async () => {
    await runWorkspaceSyncTick();

    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/v1/sync/catalog/pull"))).toBe(true);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("workspace_id=local-workspace-id"))).toBe(true);
  });

  it("materializes remote catalog workspaces before content sync", async () => {
    await runWorkspaceSyncTick();

    const appState = vi.mocked(globalThis.window.appState);
    expect(appState.upsertWorkspace).toHaveBeenCalledWith({
      id: "remote-workspace",
      title: "Remote Workspace",
    });
    expect(
      localWorkspaces.some((workspace) => workspace.id === "remote-workspace"),
    ).toBe(true);
  });
});
