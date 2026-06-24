import type {
  SavedTab,
  WorkspaceLocalConfigEntity,
  WorkspaceLocalState,
} from "../workspace";

export interface WorkspaceRepositoryContract {
  init(): Promise<void>;
  load(): Promise<WorkspaceLocalConfigEntity>;
  saveState(data: WorkspaceLocalState): Promise<void>;
  saveTabs(data: SavedTab[]): Promise<void>;
  saveLastActiveTab(data: SavedTab): Promise<void>;
}
