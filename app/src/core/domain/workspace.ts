import type { WorkspaceConf } from "../../../appState";

export interface SavedTab {
  id: string;
}

export type WorkspaceLocalConfigEntity = {
  savedTabs: SavedTab[];
} & WorkspaceConf;
