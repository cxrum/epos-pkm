export interface Tab {
  id: string;
}

export interface AppStateConfig {
  savedTabs: Tab[];
}

export interface Workspace {
  id: string;
  title: string;
  state: AppStateConfig;
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
}
