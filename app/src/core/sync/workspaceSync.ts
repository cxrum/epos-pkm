import * as Y from "yjs";
import { IpcFileSystem } from "@/core/infra/storage/storageRepository";
import type { WorkspaceEntry } from "../../../appState";
import type { AuthState } from "../../../authApi";
import { syncWorkspaceCatalog } from "./workspaceCatalogSync";

type WorkspaceSnapshot = {
  state: Record<string, unknown>;
  files: Record<string, unknown>;
};

type SyncEnvelope = {
  iv: string;
  ciphertext: string;
  compressed?: boolean;
};

type WorkspaceFileOp =
  | {
      op: "set";
      path: string;
      value: unknown;
    }
  | {
      op: "remove";
      path: string;
    };

type WorkspaceBatchPayload = {
  kind: "workspace-file-batch";
  version: 1;
  ops: WorkspaceFileOp[];
};

type WorkspaceSyncState = {
  snapshot: WorkspaceSnapshot;
  cursor: string | null;
};

const POLL_INTERVAL_MS = 30_000;
const MAX_BATCH_BYTES = 24_000;
const syncStates = new Map<string, WorkspaceSyncState>();
let syncStarted = false;

function getBase64Encoder() {
  return (value: string) => globalThis.btoa(value);
}

function getBase64Decoder() {
  return (value: string) => globalThis.atob(value);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return getBase64Encoder()(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = getBase64Decoder()(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function streamToBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (value) {
      chunks.push(value);
    }
  }

  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

async function compressBytes(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") {
    return bytes;
  }

  return await streamToBytes(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
  );
}

async function decompressBytes(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    return bytes;
  }

  return await streamToBytes(
    new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
  );
}

function stableSerialize(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([left], [right]) => left.localeCompare(right),
  );

  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`)
    .join(",")}}`;
}

function cloneSnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as WorkspaceSnapshot;
}

function createEmptySnapshot(): WorkspaceSnapshot {
  return {
    state: {},
    files: {},
  };
}

function snapshotToDoc(snapshot: WorkspaceSnapshot): Y.Doc {
  const doc = new Y.Doc();
  const stateMap = doc.getMap("state");
  const filesMap = doc.getMap("files");

  for (const [key, value] of Object.entries(snapshot.state)) {
    stateMap.set(key, value);
  }

  for (const [key, value] of Object.entries(snapshot.files)) {
    filesMap.set(key, value);
  }

  return doc;
}

function docToSnapshot(doc: Y.Doc): WorkspaceSnapshot {
  return {
    state: doc.getMap("state").toJSON() as Record<string, unknown>,
    files: doc.getMap("files").toJSON() as Record<string, unknown>,
  };
}

function applySnapshotDelta(
  targetDoc: Y.Doc,
  baseSnapshot: WorkspaceSnapshot,
  currentSnapshot: WorkspaceSnapshot,
): boolean {
  let changed = false;
  const stateMap = targetDoc.getMap("state");
  const fileMap = targetDoc.getMap("files");

  const allStateKeys = new Set([
    ...Object.keys(baseSnapshot.state),
    ...Object.keys(currentSnapshot.state),
  ]);

  for (const key of allStateKeys) {
    const baseValue = stableSerialize(baseSnapshot.state[key]);
    const currentValue = stableSerialize(currentSnapshot.state[key]);

    if (baseValue === currentValue) {
      continue;
    }

    changed = true;
    if (currentSnapshot.state[key] === undefined) {
      stateMap.delete(key);
    } else {
      stateMap.set(key, currentSnapshot.state[key]);
    }
  }

  const allFileKeys = new Set([
    ...Object.keys(baseSnapshot.files),
    ...Object.keys(currentSnapshot.files),
  ]);

  for (const key of allFileKeys) {
    const baseValue = stableSerialize(baseSnapshot.files[key]);
    const currentValue = stableSerialize(currentSnapshot.files[key]);

    if (baseValue === currentValue) {
      continue;
    }

    changed = true;
    if (currentSnapshot.files[key] === undefined) {
      fileMap.delete(key);
    } else {
      fileMap.set(key, currentSnapshot.files[key]);
    }
  }

  return changed;
}

function applyWorkspaceOps(
  snapshot: WorkspaceSnapshot,
  ops: WorkspaceFileOp[],
): void {
  for (const op of ops) {
    if (op.op === "remove") {
      if (op.path === ".workspace") {
        snapshot.state = {};
      } else {
        delete snapshot.files[op.path];
      }
      continue;
    }

    if (op.path === ".workspace") {
      snapshot.state = (op.value ?? {}) as Record<string, unknown>;
      continue;
    }

    snapshot.files[op.path] = op.value;
  }
}

function buildWorkspaceOps(
  baseSnapshot: WorkspaceSnapshot,
  currentSnapshot: WorkspaceSnapshot,
): WorkspaceFileOp[] {
  const ops: WorkspaceFileOp[] = [];

  if (stableSerialize(baseSnapshot.state) !== stableSerialize(currentSnapshot.state)) {
    if (Object.keys(currentSnapshot.state).length === 0) {
      ops.push({ op: "remove", path: ".workspace" });
    } else {
      ops.push({
        op: "set",
        path: ".workspace",
        value: currentSnapshot.state,
      });
    }
  }

  const allFileKeys = new Set([
    ...Object.keys(baseSnapshot.files),
    ...Object.keys(currentSnapshot.files),
  ]);

  for (const path of Array.from(allFileKeys).sort((left, right) =>
    left.localeCompare(right),
  )) {
    if (stableSerialize(baseSnapshot.files[path]) === stableSerialize(currentSnapshot.files[path])) {
      continue;
    }

    if (currentSnapshot.files[path] === undefined) {
      ops.push({ op: "remove", path });
      continue;
    }

    ops.push({
      op: "set",
      path,
      value: currentSnapshot.files[path],
    });
  }

  return ops;
}

function estimateBatchSize(batch: WorkspaceBatchPayload): number {
  return new TextEncoder().encode(JSON.stringify(batch)).length;
}

function buildWorkspaceBatches(
  ops: WorkspaceFileOp[],
): WorkspaceBatchPayload[] {
  const batches: WorkspaceBatchPayload[] = [];
  let currentBatch: WorkspaceBatchPayload = {
    kind: "workspace-file-batch",
    version: 1,
    ops: [],
  };

  for (const op of ops) {
    const candidate = {
      ...currentBatch,
      ops: [...currentBatch.ops, op],
    };

    if (currentBatch.ops.length > 0 && estimateBatchSize(candidate) > MAX_BATCH_BYTES) {
      batches.push(currentBatch);
      currentBatch = {
        kind: "workspace-file-batch",
        version: 1,
        ops: [op],
      };
      continue;
    }

    currentBatch = candidate;
  }

  if (currentBatch.ops.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

async function deriveKey(syncKey: string): Promise<CryptoKey> {
  const rawKey = fromBase64(syncKey);
  return await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptUpdate(syncKey: string, update: Uint8Array): Promise<string> {
  const key = await deriveKey(syncKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const supportsCompression = typeof CompressionStream !== "undefined";
  const compressed = await compressBytes(update);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, compressed),
  );

  const envelope: SyncEnvelope = {
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    compressed: supportsCompression,
  };

  return JSON.stringify(envelope);
}

async function decryptUpdate(syncKey: string, payload: string): Promise<Uint8Array> {
  const envelope = JSON.parse(payload) as SyncEnvelope;
  const key = await deriveKey(syncKey);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(envelope.iv) },
    key,
    fromBase64(envelope.ciphertext),
  );

  const decrypted = new Uint8Array(plaintext);
  if (!envelope.compressed) {
    return decrypted;
  }

  return await decompressBytes(decrypted);
}

function tryParseWorkspaceBatch(payload: Uint8Array): WorkspaceBatchPayload | null {
  try {
    const text = new TextDecoder().decode(payload);
    const parsed = JSON.parse(text) as Partial<WorkspaceBatchPayload>;

    if (
      parsed &&
      parsed.kind === "workspace-file-batch" &&
      parsed.version === 1 &&
      Array.isArray(parsed.ops)
    ) {
      return {
        kind: "workspace-file-batch",
        version: 1,
        ops: parsed.ops as WorkspaceFileOp[],
      };
    }
  } catch {
    // Fall back to legacy Yjs payloads.
  }

  return null;
}

async function readWorkspaceSnapshot(
  workspaceRelativePath: string,
): Promise<WorkspaceSnapshot> {
  const fsApi = new IpcFileSystem<Record<string, unknown>>(
    workspaceRelativePath,
  );
  const files = await fsApi.getAllFlat("");
  const workspaceState = await fsApi.get(".workspace");

  return {
    state: (workspaceState ?? {}) as Record<string, unknown>,
    files,
  };
}

async function writeWorkspaceSnapshot(
  workspaceRelativePath: string,
  snapshot: WorkspaceSnapshot,
): Promise<void> {
  const fsApi = new IpcFileSystem<Record<string, unknown>>(
    workspaceRelativePath,
  );
  const existing = await fsApi.getAllFlat("");
  const existingPaths = new Set(Object.keys(existing));
  const targetPaths = new Set(Object.keys(snapshot.files));

  for (const path of existingPaths) {
    if (!targetPaths.has(path)) {
      await fsApi.remove(path);
    }
  }

  for (const [path, data] of Object.entries(snapshot.files)) {
    await fsApi.save(path, data as Record<string, unknown>);
  }

  await fsApi.save(".workspace", snapshot.state as Record<string, unknown>);
}

async function fetchSyncState(
  syncServerUrl: string,
  accessToken: string,
  workspaceId: string,
  afterCursor: string | null,
): Promise<{ updates: { cursor: string; payload: string }[] }> {
  const url = new URL("/v1/sync/pull", syncServerUrl);
  url.searchParams.set("workspace_id", workspaceId);
  // after_cursor means "give me only updates newer than this remote cursor".
  // The client stores the last cursor it has already applied and uses it here
  // to request only incremental changes from the server.
  if (afterCursor) {
    url.searchParams.set("after_cursor", afterCursor);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Sync pull failed with status ${response.status}`);
  }

  return (await response.json()) as { updates: { cursor: string; payload: string }[] };
}

async function pushSyncUpdate(
  syncServerUrl: string,
  accessToken: string,
  workspaceId: string,
  payload: string,
): Promise<{ cursor: string }> {
  const url = new URL("/v1/sync/push", syncServerUrl);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sync push failed with status ${response.status}`);
  }

  return (await response.json()) as { cursor: string };
}

async function syncWorkspace(
  workspace: WorkspaceEntry,
  authState: AuthState,
  syncServerUrl: string,
  syncKey: string,
): Promise<void> {
  if (!authState.authenticated || !authState.user) {
    return;
  }

  const accessToken = await window.authApi.getAccessToken();
  if (!accessToken) {
    return;
  }

  const state = syncStates.get(workspace.id) ?? {
    snapshot: createEmptySnapshot(),
    cursor: null,
  };

  const currentSnapshot = await readWorkspaceSnapshot(workspace.relativePath);
  const pulledSnapshot = cloneSnapshot(state.snapshot);

  const pullResponse = await fetchSyncState(
    syncServerUrl,
    accessToken,
    workspace.id,
    state.cursor,
  );

  for (const update of pullResponse.updates) {
    const decrypted = await decryptUpdate(syncKey, update.payload);
    const batch = tryParseWorkspaceBatch(decrypted);

    if (batch) {
      applyWorkspaceOps(pulledSnapshot, batch.ops);
    } else {
      const remoteDoc = snapshotToDoc(pulledSnapshot);
      Y.applyUpdate(remoteDoc, decrypted);
      const mergedRemoteSnapshot = docToSnapshot(remoteDoc);
      pulledSnapshot.state = mergedRemoteSnapshot.state;
      pulledSnapshot.files = mergedRemoteSnapshot.files;
    }

    state.cursor = update.cursor;
  }

  const localOps = buildWorkspaceOps(state.snapshot, currentSnapshot);
  let finalCursor = state.cursor;

  if (localOps.length > 0) {
    const batches = buildWorkspaceBatches(localOps);
    for (const batch of batches) {
      const encrypted = await encryptUpdate(
        syncKey,
        new TextEncoder().encode(JSON.stringify(batch)),
      );
      const pushResponse = await pushSyncUpdate(
        syncServerUrl,
        accessToken,
        workspace.id,
        encrypted,
      );
      finalCursor = pushResponse.cursor;
    }
  }

  const mergedSnapshot = cloneSnapshot(pulledSnapshot);
  applyWorkspaceOps(mergedSnapshot, localOps);

  if (stableSerialize(mergedSnapshot) !== stableSerialize(currentSnapshot)) {
    await writeWorkspaceSnapshot(workspace.relativePath, mergedSnapshot);
  }

  state.snapshot = cloneSnapshot(mergedSnapshot);
  state.cursor = finalCursor;
  syncStates.set(workspace.id, state);
}

export async function runWorkspaceSyncTick(): Promise<void> {
  const authState = await window.authApi.getStatus();
  if (!authState.authenticated) {
    return;
  }

  const syncKey = await window.authApi.getSyncKey();
  if (!syncKey) {
    return;
  }

  const syncServerUrl = (await window.appState.getSyncServerUrl())
    .trim()
    .replace(/\/+$/, "");
  if (!syncServerUrl) {
    return;
  }

  try {
    await syncWorkspaceCatalog(authState, syncServerUrl);
  } catch (error) {
    console.error("Catalog sync failed:", error);
  }

  const workspaces = await window.appState.getWorkspaces();
  const selected = await window.appState.getSelectedWorkspace();
  const orderedWorkspaces = [
    ...workspaces.filter((workspace) => workspace.id === selected?.id),
    ...workspaces.filter((workspace) => workspace.id !== selected?.id),
  ];

  for (const workspace of orderedWorkspaces) {
    try {
      await syncWorkspace(workspace, authState, syncServerUrl, syncKey);
    } catch (error) {
      console.error(`Sync failed for workspace ${workspace.id}:`, error);
    }
  }
}

export function startWorkspaceSyncLoop(): void {
  if (syncStarted) {
    return;
  }

  syncStarted = true;
  void runWorkspaceSyncTick();
  window.setInterval(() => {
    void runWorkspaceSyncTick();
  }, POLL_INTERVAL_MS);
}

export function resetWorkspaceSyncState(): void {
  syncStates.clear();
  syncStarted = false;
}

export {
  applySnapshotDelta,
  cloneSnapshot,
  createEmptySnapshot,
  docToSnapshot,
  decryptUpdate,
  encryptUpdate,
  readWorkspaceSnapshot,
  snapshotToDoc,
  stableSerialize,
  writeWorkspaceSnapshot,
  applyWorkspaceOps,
  buildWorkspaceOps,
  buildWorkspaceBatches,
};

export type { WorkspaceSnapshot };
