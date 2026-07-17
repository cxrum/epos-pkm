import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import {
  applySnapshotDelta,
  buildWorkspaceBatches,
  buildWorkspaceOps,
  decryptUpdate,
  docToSnapshot,
  encryptUpdate,
  resetWorkspaceSyncState,
  runWorkspaceSyncTick,
  snapshotToDoc,
  stableSerialize,
} from "@/core/sync/workspaceSync";
import { resetCatalogSyncState } from "@/core/sync/workspaceCatalogSync";
import { bootstrapTypeRegistry } from "@/core/di/type";
import { TypeRegister } from "@/core/infra/typeRegister";

function createDefaultTypesRoot() {
  const typeRegister = new TypeRegister();
  bootstrapTypeRegistry(typeRegister);
  return typeRegister.systemRoot();
}

describe("workspace sync helpers", () => {
  const localWorkspaces = [
    { id: "local-workspace-id", relativePath: "projects/a" },
  ];
  const syncKey = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  let remoteContentUpdates: { cursor: string; payload: string }[] = [];
  let remoteCatalogUpdates: { cursor: string; payload: string }[] = [];

  beforeEach(() => {
    resetWorkspaceSyncState();
    resetCatalogSyncState();
    remoteContentUpdates = [];
    remoteCatalogUpdates = [];
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
        getSyncKey: vi.fn().mockResolvedValue(syncKey),
      },
      appState: {
        getWorkspaces: vi.fn().mockImplementation(async () => [...localWorkspaces]),
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
              relativePath:
                workspace.id === "remote-workspace"
                  ? "remote/workspace"
                  : `projects/${workspace.id}`,
            });
          }
          return workspace;
        }),
        getLocalWorkspace: vi.fn().mockImplementation(async (id: string) => ({
          id,
          title: id === "local-workspace-id" ? "Workspace" : "Remote Workspace",
        })),
      },
      electronFs: {
        join: vi.fn().mockImplementation((base: string, target: string) =>
          base ? `${base}/${target}` : target,
        ),
        relative: vi.fn().mockImplementation((from: string, to: string) =>
          to.startsWith(`${from}/`) ? to.slice(from.length + 1) : to,
        ),
        getAllFlat: vi.fn().mockResolvedValue({
          "root.json": { id: "-1", title: "root" },
        }),
        get: vi.fn().mockResolvedValue({ id: "local-workspace-id", title: "Workspace" }),
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
            json: async () => ({ updates: remoteCatalogUpdates }),
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
            json: async () => ({ updates: remoteContentUpdates }),
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
        "root.json": { id: "-1", title: "root" },
      },
    };

    const doc = snapshotToDoc(snapshot);
    expect(docToSnapshot(doc)).toEqual(snapshot);
  });

  it("applies only changed keys from a local snapshot", () => {
    const baseSnapshot = {
      state: { title: "Workspace", selectedWorkspace: "abc" },
      files: {
        "root.json": { id: "-1", title: "root" },
      },
    };
    const currentSnapshot = {
      state: { title: "Workspace 2", selectedWorkspace: "abc" },
      files: {
        "root.json": { id: "-1", title: "root updated" },
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

  it("builds bounded batches for workspace file ops", () => {
    const ops = Array.from({ length: 20 }, (_, index) => ({
      op: "set" as const,
      path: `root/file-${index}.json`,
      value: { id: String(index), title: `File ${index}`, body: "x".repeat(3000) },
    }));

    const batches = buildWorkspaceBatches(ops);
    expect(batches.length).toBeGreaterThan(1);
    expect(batches.flatMap((batch) => batch.ops)).toHaveLength(20);
  });

  it("skips bootstrap root and system type snapshots on first sync", () => {
    const baseSnapshot = {
      state: {},
      files: {},
    };
    const currentSnapshot = {
      state: {},
      files: {
        "root.json": {
          id: "-1",
          typeId: "sys:workspace",
          title: "root",
          content: {},
          order: [],
          properties: {
            isContainer: {
              id: "isContainer",
              title: "isContainer",
              type: "boolean",
              value: true,
            },
          },
        },
        "types/types.json": createDefaultTypesRoot(),
        "root/Untitled.json": {
          id: "page-1",
          typeId: "sys:container",
          title: "Untitled",
        },
      },
    };

    const ops = buildWorkspaceOps(baseSnapshot, currentSnapshot);

    expect(ops).toEqual([
      {
        op: "set",
        path: "root/Untitled.json",
        value: {
          id: "page-1",
          typeId: "sys:container",
          title: "Untitled",
        },
      },
    ]);
  });

  it("keeps workspace-specific types when they differ from the bootstrap system tree", () => {
    const baseSnapshot = {
      state: {},
      files: {},
    };
    const customTypes = JSON.parse(
      JSON.stringify(createDefaultTypesRoot()),
    ) as ReturnType<typeof createDefaultTypesRoot>;
    customTypes.children = [
      ...(customTypes.children ?? []),
      {
        id: "custom-type",
        type: {
          id: "custom-type",
          kind: "user",
          title: "Custom",
          propertiesScheme: {
            order: [],
            props: {},
          },
        },
        children: [],
      },
    ];

    const currentSnapshot = {
      state: {},
      files: {
        "types/types.json": customTypes,
      },
    };

    const ops = buildWorkspaceOps(baseSnapshot, currentSnapshot);

    expect(ops).toEqual([
      {
        op: "set",
        path: "types/types.json",
        value: customTypes,
      },
    ]);
  });

  it("pulls catalog and content updates using encrypted payloads", async () => {
    remoteCatalogUpdates = [
      {
        cursor: "catalog-cursor-1",
        payload: await encryptUpdate(
          syncKey,
          new TextEncoder().encode(
            JSON.stringify({
              kind: "workspace-catalog-batch",
              version: 1,
              entries: [{ id: "remote-workspace", title: "Remote Workspace" }],
            }),
          ),
        ),
      },
    ];

    remoteContentUpdates = [
      {
        cursor: "content-cursor-1",
        payload: await encryptUpdate(
          syncKey,
          new TextEncoder().encode(
            JSON.stringify({
              kind: "workspace-file-batch",
              version: 1,
              ops: [
                {
                  op: "set",
                  path: "root/Task.json",
                  value: { id: "task-1", title: "Task" },
                },
              ],
            }),
          ),
        ),
      },
    ];

    await runWorkspaceSyncTick();

    const appState = vi.mocked(globalThis.window.appState);
    expect(appState.upsertWorkspace).toHaveBeenCalledWith({
      id: "remote-workspace",
      title: "Remote Workspace",
    });

    const saveCalls = vi.mocked(window.electronFs.save).mock.calls.map(
      ([path]) => path,
    );
    expect(saveCalls).toContain("projects/a/root/Task.json");

    const fetchMock = vi.mocked(globalThis.fetch);
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("/v1/sync/catalog/pull"),
      ),
    ).toBe(true);
    expect(
      fetchMock.mock.calls.some(([url, init]) =>
        String(url).includes("/v1/sync/push") &&
        Boolean(init && typeof init === "object" && "body" in init),
      ),
    ).toBe(true);
  });

  it("decrypts opaque payloads", async () => {
    const payload = await encryptUpdate(
      syncKey,
      new TextEncoder().encode("hello world"),
    );

    const decrypted = await decryptUpdate(syncKey, payload);
    expect(new TextDecoder().decode(decrypted)).toBe("hello world");
  });
});
