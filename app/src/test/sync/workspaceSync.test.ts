import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applySnapshotDelta,
  docToSnapshot,
  runWorkspaceSyncTick,
  snapshotToDoc,
  stableSerialize,
} from "@/core/sync/workspaceSync";

describe("workspace sync helpers", () => {
  beforeEach(() => {
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
        getWorkspaces: vi.fn().mockResolvedValue([
          { id: "local-workspace-id", relativePath: "projects/a" },
        ]),
        getSelectedWorkspace: vi.fn().mockResolvedValue({
          id: "local-workspace-id",
          title: "Workspace",
          relativePath: "projects/a",
        }),
        getSyncServerUrl: vi.fn().mockResolvedValue("https://sync.example.com"),
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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ updates: [] }),
    }));
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

  it("pulls sync updates using the workspace relative path as workspace_id", async () => {
    await runWorkspaceSyncTick();

    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("workspace_id=projects%2Fa");
  });
});
