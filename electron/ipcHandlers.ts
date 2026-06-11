import { ipcMain } from "electron";
import { JsonNodeFileSystem } from "./fileSystemApi";

const fsApi = new JsonNodeFileSystem("/home/chrum/projects/epos-pkm-storage/");

export function setupIpcHandlers() {
  ipcMain.handle("fs:get", async (_, path) => await fsApi.get(path));
  ipcMain.handle(
    "fs:save",
    async (_, path, data) => await fsApi.save(path, data),
  );
  ipcMain.handle(
    "fs:move",
    async (_, src, dest) => await fsApi.move(src, dest),
  );
  ipcMain.handle("fs:remove", async (_, path) => await fsApi.remove(path));
  ipcMain.handle("fs:exists", async (_, path) => await fsApi.exists(path));
  ipcMain.handle(
    "fs:isDirectory",
    async (_, path) => await fsApi.isDirectory(path),
  );
  ipcMain.handle("fs:list", async (_, path) => await fsApi.list(path));
  ipcMain.handle(
    "fs:rename",
    async (_, path, newPath) => await fsApi.rename(path, newPath),
  );
  ipcMain.handle("fs:tree", async (_, path) => await fsApi.tree(path));
  ipcMain.handle(
    "fs:getAllFlat",
    async (_, path) => await fsApi.getAllFlat(path),
  );
}
