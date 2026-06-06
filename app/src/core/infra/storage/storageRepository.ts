import type {
  FileInfo,
  FileSystemApi,
} from "../../../../fileSystemApiContract";
import type { Edge } from "../utils";

declare global {
  interface Window {
    electronFs: FileSystemApi;
  }
}

export class IpcFileSystem<T> implements FileSystemApi<T> {
  async getAllFlat(rootPath: string): Promise<Record<string, T>> {
    return await window.electronFs.getAllFlat(rootPath);
  }
  async tree(rootPath: string): Promise<Edge<string>[]> {
    return await window.electronFs.tree(rootPath);
  }
  async get(path: string): Promise<T | undefined> {
    return await window.electronFs.get(path);
  }

  async save(path: string, data: T): Promise<void> {
    await window.electronFs.save(path, data);
  }

  async move(sourcePath: string, destinationPath: string): Promise<void> {
    await window.electronFs.move(sourcePath, destinationPath);
  }

  async remove(path: string): Promise<void> {
    await window.electronFs.remove(path);
  }

  async exists(path: string): Promise<boolean> {
    return await window.electronFs.exists(path);
  }

  async isDirectory(path: string): Promise<boolean> {
    return await window.electronFs.isDirectory(path);
  }

  async list(directoryPath: string): Promise<FileInfo[]> {
    return await window.electronFs.list(directoryPath);
  }
}
