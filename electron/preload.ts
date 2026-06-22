import { contextBridge, ipcRenderer } from "electron";
import { AppStateApi } from "../app/appState";
import { FileSystemApi } from "../app/fileSystemApiContract";

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
  getWorkspaces: () => ipcRenderer.invoke("app-state:getWorkspaces"),
  selectWorkspace: (id: string) =>
    ipcRenderer.invoke("app-state:selectWorkspace", id),
  hotReload: () => ipcRenderer.invoke("app-state:hotReload"),
  getSelectedWorkspace: () => ipcRenderer.invoke("app-state:selectedWorkspace"),
};

contextBridge.exposeInMainWorld("electronFs", fileSystemApi);
contextBridge.exposeInMainWorld("appState", appStateApi);
contextBridge.exposeInMainWorld("electronAPI", {
  selectDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
});
