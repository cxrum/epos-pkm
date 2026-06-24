import type { WorkspaceConf } from "../../../appState";
import type { _MetaKind, MetaId } from "../types";

export interface SavedTab {
  id: MetaId;
  kind: _MetaKind;
}

export type WorkspaceLocalState = {
  savedTabs: SavedTab[];
  lastActiveTab?: SavedTab;
};

export type WorkspaceLocalConfigEntity = {
  state: WorkspaceLocalState;
} & WorkspaceConf;
