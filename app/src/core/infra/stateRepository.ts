import type { AppStateApi, Workspace, AppConfig } from "../../../appState";

export class AppStateRepository implements AppStateApi {
  loadWorkspace(_path: string): Promise<Workspace> {
    return window.appState.loadWorkspace(_path);
  }
  createWorkspace(
    title: string,
    _path: string,
  ): Promise<Workspace | undefined> {
    return window.appState.createWorkspace(title, _path);
  }
  public async getWorkspaces(): Promise<Workspace[]> {
    return window.appState.getWorkspaces();
  }

  public async selectWorkspace(id: string): Promise<Workspace> {
    return window.appState.selectWorkspace(id);
  }

  public async hotReload(): Promise<AppConfig> {
    return window.appState.hotReload();
  }

  public async getSelectedWorkspace(): Promise<Workspace> {
    return window.appState.getSelectedWorkspace();
  }
}
