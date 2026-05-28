import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("browserWindow", {
    versions: () => ipcRenderer.invoke("versions"),
});

contextBridge.exposeInMainWorld('systemApi', {
  readFile: (filePath: string): Promise<string> => {
    return ipcRenderer.invoke('system:read-file', filePath);
  }
});