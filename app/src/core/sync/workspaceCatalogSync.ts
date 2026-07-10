import type { AuthState } from "../../../authApi";
import { appStateRepository } from "@/core/di/global";

type SyncEnvelope = {
  iv: string;
  ciphertext: string;
  compressed?: boolean;
};

type CatalogEntry = {
  id: string;
  title: string;
};

type CatalogBatchPayload = {
  kind: "workspace-catalog-batch";
  version: 1;
  entries: CatalogEntry[];
};

type LegacyCatalogPayload = {
  workspace_id?: unknown;
  title?: unknown;
};

type CatalogSyncState = {
  cursor: string | null;
  workspaces: Map<string, string>;
};

const catalogSyncState: CatalogSyncState = {
  cursor: null,
  workspaces: new Map(),
};

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

function tryParseCatalogBatch(payload: string): CatalogBatchPayload | null {
  try {
    const parsed = JSON.parse(payload) as Partial<CatalogBatchPayload> &
      LegacyCatalogPayload;

    if (
      parsed &&
      parsed.kind === "workspace-catalog-batch" &&
      parsed.version === 1 &&
      Array.isArray(parsed.entries)
    ) {
      return {
        kind: "workspace-catalog-batch",
        version: 1,
        entries: parsed.entries as CatalogEntry[],
      };
    }

    if (
      typeof parsed.workspace_id === "string" &&
      typeof parsed.title === "string"
    ) {
      return {
        kind: "workspace-catalog-batch",
        version: 1,
        entries: [
          {
            id: parsed.workspace_id,
            title: parsed.title,
          },
        ],
      };
    }
  } catch {
    // Fall through.
  }

  return null;
}

async function fetchCatalogState(
  syncServerUrl: string,
  accessToken: string,
  afterCursor: string | null,
): Promise<{ updates: { cursor: string; payload: string }[] }> {
  const url = new URL("/v1/sync/catalog/pull", syncServerUrl);
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
    throw new Error(`Catalog pull failed with status ${response.status}`);
  }

  return (await response.json()) as { updates: { cursor: string; payload: string }[] };
}

async function pushCatalogUpdate(
  syncServerUrl: string,
  accessToken: string,
  payload: string,
): Promise<{ cursor: string }> {
  const url = new URL("/v1/sync/catalog/push", syncServerUrl);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Catalog push failed with status ${response.status}`);
  }

  return (await response.json()) as { cursor: string };
}

function buildCatalogBatch(entries: CatalogEntry[]): CatalogBatchPayload {
  return {
    kind: "workspace-catalog-batch",
    version: 1,
    entries,
  };
}

export async function syncWorkspaceCatalog(
  authState: AuthState,
  syncServerUrl: string,
): Promise<void> {
  if (!authState.authenticated || !authState.user) {
    return;
  }

  const accessToken = await window.authApi.getAccessToken();
  if (!accessToken) {
    return;
  }

  const syncKey = await window.authApi.getSyncKey();
  if (!syncKey) {
    return;
  }

  const pullResponse = await fetchCatalogState(
    syncServerUrl,
    accessToken,
    catalogSyncState.cursor,
  );

  for (const update of pullResponse.updates) {
    let batch = tryParseCatalogBatch(update.payload);

    if (!batch) {
      try {
        const decrypted = await decryptUpdate(syncKey, update.payload);
        batch = tryParseCatalogBatch(new TextDecoder().decode(decrypted));
      } catch {
        batch = null;
      }
    }

    if (!batch) {
      catalogSyncState.cursor = update.cursor;
      continue;
    }

    for (const entry of batch.entries) {
      catalogSyncState.workspaces.set(entry.id, entry.title);
      await appStateRepository.upsertWorkspace({
        id: entry.id,
        title: entry.title,
      });
    }

    catalogSyncState.cursor = update.cursor;
  }

  const localWorkspaces = await appStateRepository.getWorkspaces();
  const localEntries = await Promise.all(
    localWorkspaces.map(async (workspace) => {
      const local = await appStateRepository.getLocalWorkspace(workspace.id);
      if (!local) {
        return null;
      }

      return {
        id: local.id,
        title: local.title,
      };
    }),
  );

  for (const entry of localEntries.filter((item): item is CatalogEntry => item !== null)) {
    const remoteTitle = catalogSyncState.workspaces.get(entry.id);
    if (remoteTitle === entry.title) {
      continue;
    }

    const encrypted = await encryptUpdate(
      syncKey,
      new TextEncoder().encode(JSON.stringify(buildCatalogBatch([entry]))),
    );
    const pushResponse = await pushCatalogUpdate(
      syncServerUrl,
      accessToken,
      encrypted,
    );
    catalogSyncState.workspaces.set(entry.id, entry.title);
    catalogSyncState.cursor = pushResponse.cursor;
  }
}

export function resetCatalogSyncState(): void {
  catalogSyncState.cursor = null;
  catalogSyncState.workspaces.clear();
}
