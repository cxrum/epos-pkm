export interface WorkspaceConf {
  id: string;
  title: string;
}

export interface WorkspaceEntry {
  id: string;
  absolutePath: string;
}

export interface AppConfig {
  selectedWorkspace: string;
  customSyncServerUrl: string | null;
}

export interface AppStateApi {
  getWorkspaces(): Promise<WorkspaceEntry[]>;
  getSyncServerUrl(): Promise<string>;
  setSyncServerUrl(url: string | null): Promise<string>;
  hotReload(): Promise<AppConfig>;
  selectWorkspace(id: string): Promise<WorkspaceConf>;
  getSelectedWorkspace(): Promise<WorkspaceConf | undefined>;
  createWorkspace(
    title: string,
    _path: string,
  ): Promise<WorkspaceConf | undefined>;
  loadWorkspace(_path: string): Promise<WorkspaceConf>;
  getLocalWorkspace(id: string): Promise<WorkspaceConf | undefined>;
}
