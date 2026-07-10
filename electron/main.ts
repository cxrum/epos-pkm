import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Menu,
  ipcMain,
  screen,
} from "electron";
import { APP_NAME, DEFAULT_SYNC_SERVER_URL, isDev } from "./config";
import { appConfig } from "./electronStore/configuration";
import AppUpdater from "./autoUpdate";
import { setupWorkSpaceStorage } from "./handlers/workspaceStorageHandlers";
import { console } from "inspector";
import path from "path";
import * as fs from "fs/promises";
import { RawAppStateService } from "./AppStateService";
import { setupAppState } from "./handlers/configHanlders";
import { AuthService } from "./AuthService";
import { setupAuthHandlers } from "./handlers/authHandlers";
import { migrateLegacyAuthFields } from "./electronStore/authentication";

function resolveWindowIcon() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "icon.png");
  }

  return path.join(app.getAppPath(), "electron", "icons", "icon.png");
}

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const appBounds: any = appConfig.get("setting.appBounds");
  const BrowserWindowOptions: BrowserWindowConstructorOptions = {
    width: 1200,
    minWidth: 900,
    height: 750,
    minHeight: 600,

    webPreferences: {
      preload: __dirname + "/preload.js",
      devTools: isDev,
    },
    show: false,
    alwaysOnTop: true,
    frame: true,
    title: APP_NAME,
    icon: resolveWindowIcon(),
  };
  if (appBounds !== undefined && appBounds !== null)
    Object.assign(BrowserWindowOptions, appBounds);
  const mainWindow = new BrowserWindow(BrowserWindowOptions);

  if (!isDev) AppUpdater();
  await mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "./index.html")}`,
  );

  if (
    appBounds !== undefined &&
    appBounds !== null &&
    appBounds.width > width &&
    appBounds.height > height
  )
    mainWindow.maximize();
  else mainWindow.show();

  setTimeout(() => {
    mainWindow.setAlwaysOnTop(false);
  }, 1000);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  const menu = Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [
        {
          label: "Select Workspaces",
          accelerator: "CmdOrCtrl+Shift+O",
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(
              "app:open-workspace-chooser",
            );
          },
        },
        { type: "separator" },
        {
          role: "quit",
          label: "Quit",
          accelerator: "CmdOrCtrl+Q",
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          role: "reload",
          label: "Reload",
        },
        {
          role: "toggleDevTools",
          label: "Toggle Developer Tools",
          accelerator: "CmdOrCtrl+Shift+I",
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  if (isDev) {
    try {
      const { installExt } = await import("./installDevTool");
      await installExt();
    } catch (e) {}
  }

  ipcMain.handle("system:read-file", async (event, filePath: string) => {
    try {
      const safePath = path.normalize(filePath);
      const content = await fs.readFile(safePath, "utf-8");
      return content;
    } catch (error) {
      console.error(`Failed to read file at ${filePath}:`, error);
      throw new Error("FILE_READ_ERROR");
    }
  });

  ipcMain.handle("versions", () => {
    return {
      node: process.versions.chrome,
      chrome: process.versions.chrome,
      electron: process.versions.electron,
      version: app.getVersion(),
      name: app.getName(),
    };
  });

  createWindow();
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const appStateService = new RawAppStateService(DEFAULT_SYNC_SERVER_URL);
  migrateLegacyAuthFields();
  const authService = new AuthService(() => appStateService.getSyncServerUrl());

  setupAppState(appStateService);
  setupWorkSpaceStorage(appStateService);
  setupAuthHandlers(authService);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
