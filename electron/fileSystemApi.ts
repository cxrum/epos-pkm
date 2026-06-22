import * as fs from "fs/promises";
import * as path from "path";
import type { FileInfo, FileSystemApi } from "../app/fileSystemApiContract";
import { RawAppStateService } from "./AppStateService";

export class JsonNodeFileSystem<
  T extends { id: string | number },
> implements FileSystemApi<T> {
  private appState: RawAppStateService;

  constructor(appStateService: RawAppStateService) {
    this.appState = appStateService;
  }

  private getWorkspacePath(): string {
    const workspacePath = this.appState.getSelectedWorkspacePath();
    if (!workspacePath) {
      throw Error();
    }
    return workspacePath;
  }

  private getFullPath(targetPath: string): string {
    return path.join(this.getWorkspacePath(), targetPath);
  }

  async get(targetPath: string): Promise<T | undefined> {
    const fullPath = this.getFullPath(targetPath);
    try {
      const content = await fs.readFile(fullPath, "utf-8");
      return JSON.parse(content) as T;
    } catch {
      return undefined;
    }
  }

  async save(targetPath: string, data: T): Promise<void> {
    const fullPath = this.getFullPath(targetPath);
    const dirPath = path.dirname(fullPath);

    await fs.mkdir(dirPath, { recursive: true });

    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(fullPath, content, "utf-8");
  }

  async move(sourcePath: string, destinationPath: string): Promise<void> {
    const fullSourcePath = this.getFullPath(sourcePath);
    const fullDestPath = this.getFullPath(destinationPath);
    const destDirPath = path.dirname(fullDestPath);

    await fs.mkdir(destDirPath, { recursive: true });
    await fs.rename(fullSourcePath, fullDestPath);
  }

  async remove(targetPath: string): Promise<void> {
    const fullPath = this.getFullPath(targetPath);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.unlink(fullPath);
    }
  }

  async exists(targetPath: string): Promise<boolean> {
    const fullPath = this.getFullPath(targetPath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  private async getInfo(targetPath: string): Promise<FileInfo> {
    const fullPath = this.getFullPath(targetPath);
    const stat = await fs.stat(fullPath);
    const isDir = stat.isDirectory();

    return {
      path: targetPath,
      type: isDir ? "dir" : "file",
      extension: isDir ? undefined : path.extname(targetPath).toLowerCase(),
    };
  }

  async isDirectory(targetPath: string): Promise<boolean> {
    const fullPath = this.getFullPath(targetPath);
    const stat = await fs.stat(fullPath);
    return stat.isDirectory();
  }

  async list(directoryPath: string): Promise<FileInfo[]> {
    const fullPath = this.getFullPath(directoryPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    return entries.map((entry) => {
      const relativePath = path.join(directoryPath, entry.name);
      const isDir = entry.isDirectory();

      return {
        path: relativePath,
        type: isDir ? "dir" : "file",
        extension: isDir ? undefined : path.extname(entry.name).toLowerCase(),
      };
    });
  }

  async rename(path: string, newPath: string): Promise<boolean> {
    const newFileExist = await this.exists(newPath);
    const current = await this.exists(path);

    const fullOldPath = this.getFullPath(path);
    const fullNewPath = this.getFullPath(newPath);

    if (!newFileExist && current) {
      await fs.rename(fullOldPath, fullNewPath);
      return true;
    }

    return false;
  }

  async tree(rootPath: string): Promise<{ source: string; target: string }[]> {
    const fullRootPath = this.getFullPath(rootPath);
    const workspacePath = this.getWorkspacePath();

    const traverse = async (
      currentPath: string,
      discovered: Set<string> = new Set<string>(),
      treeEdges: { source: string; target: string }[] = [],
    ) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (let index = 0; index < entries.length; index++) {
        const el = entries[index];
        const absolutePath = path.join(currentPath, el.name);

        if (!discovered.has(absolutePath)) {
          discovered.add(absolutePath);

          const isDir = el.isDirectory();
          let relativeSource = path.relative(workspacePath, currentPath);
          const relativeTarget = path.relative(workspacePath, absolutePath);

          if (relativeSource === "") {
            relativeSource = ".";
          }

          treeEdges.push({
            source: relativeSource,
            target: relativeTarget,
          });

          if (isDir) {
            await traverse(absolutePath, discovered, treeEdges);
          }
        }
      }

      return treeEdges;
    };

    return await traverse(fullRootPath);
  }

  async getAllFlat(rootPath: string): Promise<Record<string, T>> {
    const fullRootPath = path.resolve(this.getFullPath(rootPath));

    const traverse = async (
      currentPath: string,
      discovered: Set<string> = new Set<string>(),
      fileData: Record<string, T> = {},
    ) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (let index = 0; index < entries.length; index++) {
        const el = entries[index];
        const absolutePath = path.resolve(currentPath, el.name);

        const relativeTarget = path.relative(fullRootPath, absolutePath);

        if (!discovered.has(absolutePath)) {
          discovered.add(absolutePath);
          const isDir = el.isDirectory();

          if (isDir) {
            await traverse(absolutePath, discovered, fileData);
          } else if (el.name.endsWith(".json")) {
            const content = await fs.readFile(absolutePath, "utf-8");
            fileData[relativeTarget] = JSON.parse(content) as T;
          }
        }
      }

      return fileData;
    };

    return await traverse(fullRootPath);
  }
}
