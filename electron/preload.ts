import { contextBridge, ipcRenderer } from "electron";
import { AppStateApi } from "../app/appState";
import { FileSystemApi } from "../app/fileSystemApiContract";
import { title } from "process";
import type { AuthApi, AuthCredentials } from "./auth/types";

contextBridge.exposeInMainWorld("browserWindow", {
  versions: () => ipcRenderer.invoke("versions"),
});

const fileSystemApi: FileSystemApi = {
  get: (path: string) => ipcRenderer.invoke("fs:get", path),
  save: (path: string, data: any) => ipcRenderer.invoke("fs:save", path, data),
  move: (src: string, dest: string) => ipcRenderer.invoke("fs:move", src, dest),
  remove: (path: string) => ipcRenderer.invoke("fs:remove", path),
  rename: (path: string, newPath: string) =>
    ipcRenderer.invoke("fs:rename", path, newPath),
  exists: (path: string) => ipcRenderer.invoke("fs:exists", path),
  isDirectory: (path: string) => ipcRenderer.invoke("fs:isDirectory", path),
  list: (path: string) => ipcRenderer.invoke("fs:list", path),
  tree: (path: string) => ipcRenderer.invoke("fs:tree", path),
  getAllFlat: (path: string) => ipcRenderer.invoke("fs:getAllFlat", path),
};

const appStateApi: AppStateApi = {
  getLocalWorkspace: (id: string) =>
    ipcRenderer.invoke("app-state:getLocalWorkspace", id),
  getWorkspaces: () => ipcRenderer.invoke("app-state:getWorkspaces"),
  selectWorkspace: (id: string) =>
    ipcRenderer.invoke("app-state:selectWorkspace", id),
  hotReload: () => ipcRenderer.invoke("app-state:hotReload"),
  getSelectedWorkspace: () => ipcRenderer.invoke("app-state:selectedWorkspace"),
  createWorkspace: (title, _path) =>
    ipcRenderer.invoke("app-state:createWorkspace", title, _path),
  loadWorkspace: (_path) =>
    ipcRenderer.invoke("app-state:loadWorkspace", _path),
};

contextBridge.exposeInMainWorld("electronFs", fileSystemApi);
contextBridge.exposeInMainWorld("appState", appStateApi);
const authApi: AuthApi = {
  getStatus: () => ipcRenderer.invoke("auth:getStatus"),
  login: (payload: AuthCredentials) => ipcRenderer.invoke("auth:login", payload),
  register: (payload: AuthCredentials) =>
    ipcRenderer.invoke("auth:register", payload),
  skipAuth: (neverAskAgain: boolean) =>
    ipcRenderer.invoke("auth:skip", neverAskAgain),
};

contextBridge.exposeInMainWorld("authApi", authApi);
contextBridge.exposeInMainWorld("electronAPI", {
  selectDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
});
