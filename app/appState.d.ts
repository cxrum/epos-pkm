export interface Workspace {
  id: string;
  title: string;
  absolutePath: string;
}

export interface AppConfig {
  workspaces: Workspace[];
  selectedWorkspace: string;
}

export interface AppStateApi {
  getWorkspaces(): Promise<Workspace[]>;
  selectWorkspace(id: string): Promise<Workspace>;
  hotReload(): Promise<AppConfig>;
  getSelectedWorkspace(): Promise<Workspace>;

  createWorkspace(title: string, _path: string): Promise<Workspace | undefined>;
  loadWorkspace(_path: string): Promise<Workspace>;
}
