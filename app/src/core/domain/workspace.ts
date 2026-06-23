import type { Workspace } from "../../../appState";

export interface Tab {
  id: string;
}

export type WorkspaceLocalConfigEntity = {
  savedTabs: Tab[];
} & Workspace;
