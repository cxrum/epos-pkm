export interface WorkspaceConf {
  id: string;
  title: string;
}

export interface WorkspaceSelection extends WorkspaceConf {
  relativePath: string;
}

export interface WorkspaceEntry {
  id: string;
  relativePath: string;
}

export interface AppConfig {
  workspacesRootPath: string;
  selectedWorkspace: string;
  customSyncServerUrl: string | null;
}

export interface AppStateApi {
  getWorkspaces(): Promise<WorkspaceEntry[]>;
  getWorkspacesRootPath(): Promise<string>;
  getSyncServerUrl(): Promise<string>;
  setSyncServerUrl(url: string | null): Promise<string>;
  hotReload(): Promise<AppConfig>;
  selectWorkspace(id: string): Promise<WorkspaceConf>;
  selectWorkspacesRoot(path: string): Promise<WorkspaceConf | undefined>;
  clearSelectedWorkspace(): Promise<void>;
  getSelectedWorkspace(): Promise<WorkspaceSelection | undefined>;
  createWorkspace(title: string): Promise<WorkspaceConf | undefined>;
  getLocalWorkspace(id: string): Promise<WorkspaceConf | undefined>;
}
