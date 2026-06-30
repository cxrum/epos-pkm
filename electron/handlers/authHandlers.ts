import { ipcMain } from "electron";
import { AuthService } from "../AuthService";
import type { AuthCredentials } from "../auth/types";

export function setupAuthHandlers(authService: AuthService) {
  ipcMain.handle("auth:getStatus", () => authService.getStatus());

  ipcMain.handle("auth:login", (_, payload: AuthCredentials) =>
    authService.login(payload),
  );

  ipcMain.handle("auth:register", (_, payload: AuthCredentials) =>
    authService.register(payload),
  );

  ipcMain.handle("auth:skip", (_, neverAskAgain: boolean) =>
    authService.skipAuth(neverAskAgain),
  );
}
