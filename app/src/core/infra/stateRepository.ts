import type {
  AppConfig,
  AppStateApi,
  WorkspaceConf,
  WorkspaceEntry,
} from "../../../appState";

export class AppStateRepository implements AppStateApi {
  getLocalWorkspace(id: string): Promise<WorkspaceConf | undefined> {
    return window.appState.getLocalWorkspace(id);
  }
  hotReload(): Promise<AppConfig> {
    return window.appState.hotReload();
  }
  loadWorkspace(_path: string): Promise<WorkspaceConf> {
    return window.appState.loadWorkspace(_path);
  }
  createWorkspace(
    title: string,
    _path: string,
  ): Promise<WorkspaceConf | undefined> {
    return window.appState.createWorkspace(title, _path);
  }
  public async getWorkspaces(): Promise<WorkspaceEntry[]> {
    return window.appState.getWorkspaces();
  }

  public async selectWorkspace(id: string): Promise<WorkspaceConf> {
    return window.appState.selectWorkspace(id);
  }

  public async getSelectedWorkspace(): Promise<WorkspaceConf | undefined> {
    return window.appState.getSelectedWorkspace();
  }
}
