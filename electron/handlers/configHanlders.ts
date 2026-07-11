import { dialog, ipcMain } from "electron";
import { RawAppStateService } from "../AppStateService";

export function setupAppState(stateService: RawAppStateService) {
  ipcMain.handle("app-state:getWorkspaces", () => stateService.getWorkspaces());
  ipcMain.handle("app-state:getWorkspacesRootPath", () =>
    stateService.getWorkspacesRootPathSync(),
  );
  ipcMain.handle("app-state:getSyncServerUrl", () =>
    stateService.getSyncServerUrl(),
  );
  ipcMain.handle("app-state:setSyncServerUrl", (_, url: string | null) =>
    stateService.setSyncServerUrl(url),
  );

  ipcMain.handle("app-state:selectWorkspace", (_, id: string) => {
    return stateService.selectWorkspace(id);
  });

  ipcMain.handle("app-state:getLocalWorkspace", (_, id: string) => {
    return stateService.getLocalWorkspace(id);
  });
  ipcMain.handle("app-state:selectWorkspacesRoot", (_, rootPath: string) => {
    return stateService.selectWorkspacesRoot(rootPath);
  });
  ipcMain.handle("app-state:clearSelectedWorkspace", () =>
    stateService.clearSelectedWorkspace(),
  );

  ipcMain.handle("app-state:hotReload", () => stateService.hotReload());
  ipcMain.handle("app-state:selectedWorkspace", () =>
    stateService.getSelectedWorkspace(),
  );
  ipcMain.handle(
    "app-state:createWorkspace",
    (_, title: string) => {
      return stateService.createWorkspace(title);
    },
  );
  ipcMain.handle("app-state:upsertWorkspace", (_, workspace) => {
    return stateService.upsertWorkspace(workspace);
  });
  ipcMain.handle("app-state:renameWorkspace", (_, id: string, title: string) => {
    return stateService.renameWorkspace(id, title);
  });
  ipcMain.handle("app-state:deleteWorkspace", (_, id: string) => {
    return stateService.deleteWorkspace(id);
  });

  ipcMain.handle("dialog:openDirectory", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (canceled) {
      return null;
    }

    return filePaths[0];
  });
}
