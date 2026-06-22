import { dialog, ipcMain } from "electron";
import { RawAppStateService } from "../AppStateService";

export function setupAppState(stateService: RawAppStateService) {
  ipcMain.handle("app-state:getWorkspaces", () => stateService.getWorkspaces());

  ipcMain.handle("app-state:selectWorkspace", (_, id: string) => {
    return stateService.selectWorkspace(id);
  });

  ipcMain.handle("app-state:hotReload", () => stateService.hotReload());
  ipcMain.handle("app-state:selectedWorkspace", () =>
    stateService.getSelectedWorkspace(),
  );

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
