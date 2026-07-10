import type {
  AppConfig,
  AppStateApi,
  WorkspaceConf,
  WorkspaceEntry,
  WorkspaceSelection,
} from "../../../appState";

export class AppStateRepository implements AppStateApi {
  getLocalWorkspace(id: string): Promise<WorkspaceConf | undefined> {
    return window.appState.getLocalWorkspace(id);
  }
  getWorkspacesRootPath(): Promise<string> {
    return window.appState.getWorkspacesRootPath();
  }
  getSyncServerUrl(): Promise<string> {
    return window.appState.getSyncServerUrl();
  }
  setSyncServerUrl(url: string | null): Promise<string> {
    return window.appState.setSyncServerUrl(url);
  }
  hotReload(): Promise<AppConfig> {
    return window.appState.hotReload();
  }
  selectWorkspacesRoot(path: string): Promise<WorkspaceConf | undefined> {
    return window.appState.selectWorkspacesRoot(path);
  }
  clearSelectedWorkspace(): Promise<void> {
    return window.appState.clearSelectedWorkspace();
  }
  createWorkspace(title: string): Promise<WorkspaceConf | undefined> {
    return window.appState.createWorkspace(title);
  }
  upsertWorkspace(workspace: WorkspaceConf): Promise<WorkspaceConf | undefined> {
    return window.appState.upsertWorkspace(workspace);
  }
  public async getWorkspaces(): Promise<WorkspaceEntry[]> {
    return window.appState.getWorkspaces();
  }

  public async selectWorkspace(id: string): Promise<WorkspaceConf> {
    return window.appState.selectWorkspace(id);
  }

  public async getSelectedWorkspace(): Promise<WorkspaceSelection | undefined> {
    return window.appState.getSelectedWorkspace();
  }
}
