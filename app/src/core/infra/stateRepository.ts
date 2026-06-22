import type { AppStateApi, Workspace, AppConfig } from "../../../appState";

export class AppStateRepository implements AppStateApi {
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
