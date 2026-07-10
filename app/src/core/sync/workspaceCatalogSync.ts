import type { AuthState } from "../../../authApi";
import { appStateRepository } from "@/core/di/global";

type CatalogUpdate = {
  cursor: string;
  workspace_id: string;
  title: string;
};

type CatalogSyncState = {
  cursor: string | null;
  workspaces: Map<string, string>;
};

const catalogSyncState: CatalogSyncState = {
  cursor: null,
  workspaces: new Map(),
};

async function fetchCatalogState(
  syncServerUrl: string,
  accessToken: string,
  afterCursor: string | null,
): Promise<{ updates: CatalogUpdate[] }> {
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

  return (await response.json()) as { updates: CatalogUpdate[] };
}

async function pushCatalogUpdate(
  syncServerUrl: string,
  accessToken: string,
  workspaceId: string,
  title: string,
): Promise<{ cursor: string }> {
  const url = new URL("/v1/sync/catalog/push", syncServerUrl);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      title,
    }),
  });

  if (!response.ok) {
    throw new Error(`Catalog push failed with status ${response.status}`);
  }

  return (await response.json()) as { cursor: string };
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

  const pullResponse = await fetchCatalogState(
    syncServerUrl,
    accessToken,
    catalogSyncState.cursor,
  );

  for (const update of pullResponse.updates) {
    catalogSyncState.workspaces.set(update.workspace_id, update.title);
    catalogSyncState.cursor = update.cursor;
    await appStateRepository.upsertWorkspace({
      id: update.workspace_id,
      title: update.title,
    });
  }

  const localWorkspaces = await appStateRepository.getWorkspaces();
  for (const workspace of localWorkspaces) {
    const local = await appStateRepository.getLocalWorkspace(workspace.id);
    if (!local) {
      continue;
    }

    const remoteTitle = catalogSyncState.workspaces.get(workspace.id);
    if (remoteTitle === local.title) {
      continue;
    }

    const pushResponse = await pushCatalogUpdate(
      syncServerUrl,
      accessToken,
      local.id,
      local.title,
    );
    catalogSyncState.workspaces.set(local.id, local.title);
    catalogSyncState.cursor = pushResponse.cursor;
  }
}

export function resetCatalogSyncState(): void {
  catalogSyncState.cursor = null;
  catalogSyncState.workspaces.clear();
}
