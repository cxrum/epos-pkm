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
  private readonly basePath: string | undefined;

  constructor(basePath: string | undefined) {
    this.basePath = basePath;
  }

  private resolvePath(targetPath: string): string {
    if (!this.basePath) {
      return targetPath;
    }
    const cleanTarget = targetPath.replace(/^(\.\/|\/+)+/, "");
    if (!cleanTarget) {
      return this.basePath;
    }
    if (this.basePath.endsWith("/")) {
      return `${this.basePath}${cleanTarget}`;
    }

    return `${this.basePath}/${cleanTarget}`;
  }

  private toSerializable<TValue>(value: TValue): TValue {
    return JSON.parse(JSON.stringify(value)) as TValue;
  }

  async rename(path: string, newPath: string): Promise<boolean> {
    return await window.electronFs.rename(
      this.resolvePath(path),
      this.resolvePath(newPath),
    );
  }

  async getAllFlat(rootPath: string): Promise<Record<string, T>> {
    return await window.electronFs.getAllFlat(this.resolvePath(rootPath));
  }

  async tree(rootPath: string): Promise<Edge<string>[]> {
    return await window.electronFs.tree(this.resolvePath(rootPath));
  }

  async get(path: string): Promise<T | undefined> {
    return await window.electronFs.get(this.resolvePath(path));
  }

  async save(path: string, data: T): Promise<void> {
    await window.electronFs.save(
      this.resolvePath(path),
      this.toSerializable(data),
    );
  }

  async move(sourcePath: string, destinationPath: string): Promise<void> {
    await window.electronFs.move(
      this.resolvePath(sourcePath),
      this.resolvePath(destinationPath),
    );
  }

  async remove(path: string): Promise<void> {
    await window.electronFs.remove(this.resolvePath(path));
  }

  async exists(path: string): Promise<boolean> {
    return await window.electronFs.exists(this.resolvePath(path));
  }

  async isDirectory(path: string): Promise<boolean> {
    return await window.electronFs.isDirectory(this.resolvePath(path));
  }

  async list(directoryPath: string): Promise<FileInfo[]> {
    return await window.electronFs.list(this.resolvePath(directoryPath));
  }
}
