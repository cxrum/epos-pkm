import { contextBridge, ipcRenderer } from "electron";
import type { FileInfo } from "../app/fileSystemApiContract";

contextBridge.exposeInMainWorld("browserWindow", {
  versions: () => ipcRenderer.invoke("versions"),
});

contextBridge.exposeInMainWorld("electronFs", {
  get: (path: string) => ipcRenderer.invoke("fs:get", path),
  save: (path: string, data: any) => ipcRenderer.invoke("fs:save", path, data),
  move: (src: string, dest: string) => ipcRenderer.invoke("fs:move", src, dest),
  remove: (path: string) => ipcRenderer.invoke("fs:remove", path),
  exists: (path: string) => ipcRenderer.invoke("fs:exists", path),
  isDirectory: (path: string) => ipcRenderer.invoke("fs:isDirectory", path),
  list: (path: string) => ipcRenderer.invoke("fs:list", path),
});
