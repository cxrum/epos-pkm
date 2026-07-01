import type {
  FileInfo,
  FileSystemApi,
} from "../../../../fileSystemApiContract";
import type { Edge } from "../utils";

export class IpcFileSystem<T extends any> implements FileSystemApi<T> {
  private readonly basePath: string | undefined;

  constructor(basePath: string | undefined) {
    this.basePath = basePath;
  }
  async join(basePath: string | undefined, targetPath: string | undefined): Promise<string> {
    return await window.electronFs.join(basePath, targetPath)
  }

  async parse(targetPath: string): Promise<FileInfo> {
    return await window.electronFs.parse(targetPath)
  }

  async renameFile(filePath: string, newTitle: string): Promise<string> {
    return await window.electronFs.renameFile(await this.resolvePath(filePath), newTitle)  
  }

  private async resolvePath(targetPath: string): Promise<string> {
    const cleanTarget = await this.join(this.basePath, targetPath)
    return cleanTarget
  }

  private toSerializable<TValue>(value: TValue): TValue {
    return JSON.parse(JSON.stringify(value)) as TValue;
  }

  async rename(path: string, newPath: string): Promise<boolean> {
    return await window.electronFs.rename(
      await this.resolvePath(path),
      await this.resolvePath(newPath),
    );
  }

  async getAllFlat(rootPath: string): Promise<Record<string, T>> {
    return await window.electronFs.getAllFlat(await this.resolvePath(rootPath));
  }

  async tree(rootPath: string): Promise<Edge<string>[]> {
    return await window.electronFs.tree(await this.resolvePath(rootPath));
  }

  async get(path: string): Promise<T | undefined> {
    return await window.electronFs.get(await this.resolvePath(path));
  }

  async save(path: string, data: T): Promise<void> {
    await window.electronFs.save(
      await this.resolvePath(path),
      this.toSerializable(data),
    );
  }

  async move(sourcePath: string, destinationPath: string): Promise<void> {
    await window.electronFs.move(
      await this.resolvePath(sourcePath),
      await this.resolvePath(destinationPath),
    );
  }

  async remove(path: string): Promise<void> {
    await window.electronFs.remove(await this.resolvePath(path));
  }

  async exists(path: string): Promise<boolean> {
    return await window.electronFs.exists(await this.resolvePath(path));
  }

  async isDirectory(path: string): Promise<boolean> {
    return await window.electronFs.isDirectory(await this.resolvePath(path));
  }

  async list(directoryPath: string): Promise<FileInfo[]> {
    return await window.electronFs.list(await this.resolvePath(directoryPath));
  }
}
