import type { Edge } from "@/core/infra/utils";
import type { FileInfo, FileSystemApi } from "../../../fileSystemApiContract";

export class MockFileSystem<T> implements FileSystemApi<T> {
  private files = new Map<string, T>();
  private directories = new Set<string>();

  constructor() {
    this.directories.add("");
  }

  private normalizePath(path: string): string {
    return path
      .replace(/^(\.\/|\/+)+/, "")
      .replace(/\/+$/, "")
      .replace(/\/+/g, "/");
  }

  private toSerializable<TValue>(value: TValue): TValue {
    return JSON.parse(JSON.stringify(value)) as TValue;
  }

  async save(path: string, data: T): Promise<void> {
    const normalizedPath = this.normalizePath(path);
    const parts = normalizedPath.split("/");

    let currentPath = "";
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      this.directories.add(currentPath);
    }

    this.files.set(normalizedPath, this.toSerializable(data));
  }

  async get(path: string): Promise<T | undefined> {
    const normalizedPath = this.normalizePath(path);
    const data = this.files.get(normalizedPath);
    return data ? this.toSerializable(data) : undefined;
  }

  async exists(path: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(path);
    return (
      this.files.has(normalizedPath) || this.directories.has(normalizedPath)
    );
  }

  async isDirectory(path: string): Promise<boolean> {
    const normalizedPath = this.normalizePath(path);

    if (normalizedPath === "") return true;
    return this.directories.has(normalizedPath);
  }

  async remove(path: string): Promise<void> {
    const normalizedPath = this.normalizePath(path);

    if (this.files.has(normalizedPath)) {
      this.files.delete(normalizedPath);
      return;
    }

    const prefix = `${normalizedPath}/`;

    for (const key of this.files.keys()) {
      if (key.startsWith(prefix)) this.files.delete(key);
    }

    for (const key of this.directories.keys()) {
      if (key === normalizedPath || key.startsWith(prefix)) {
        this.directories.delete(key);
      }
    }
  }

  async rename(path: string, newPath: string): Promise<boolean> {
    const normalizedOld = this.normalizePath(path);
    const normalizedNew = this.normalizePath(newPath);

    if (!(await this.exists(normalizedOld))) return false;

    await this.move(normalizedOld, normalizedNew);
    return true;
  }

  async move(sourcePath: string, destinationPath: string): Promise<void> {
    const oldPath = this.normalizePath(sourcePath);
    const newPath = this.normalizePath(destinationPath);

    if (this.files.has(oldPath)) {
      const data = this.files.get(oldPath)!;
      await this.save(newPath, data);
      this.files.delete(oldPath);
      return;
    }

    if (this.directories.has(oldPath)) {
      const oldPrefix = `${oldPath}/`;
      const newPrefix = `${newPath}/`;

      for (const [key, value] of this.files.entries()) {
        if (key.startsWith(oldPrefix)) {
          const newFileKey = key.replace(oldPrefix, newPrefix);
          await this.save(newFileKey, value);
          this.files.delete(key);
        }
      }

      const dirsToMove = Array.from(this.directories).filter((d) =>
        d.startsWith(oldPrefix),
      );
      for (const dir of dirsToMove) {
        const newDirKey = dir.replace(oldPrefix, newPrefix);
        this.directories.add(newDirKey);
        this.directories.delete(dir);
      }

      this.directories.add(newPath);
      this.directories.delete(oldPath);
    }
  }

  async getAllFlat(rootPath: string): Promise<Record<string, T>> {
    const normalizedRoot = this.normalizePath(rootPath);
    const prefix = normalizedRoot ? `${normalizedRoot}/` : "";
    const result: Record<string, T> = {};

    for (const [path, data] of this.files.entries()) {
      if (
        normalizedRoot === "" ||
        path === normalizedRoot ||
        path.startsWith(prefix)
      ) {
        result[path] = this.toSerializable(data);
      }
    }

    return result;
  }

  async tree(rootPath: string): Promise<Edge<string>[]> {
    const normalizedRoot = this.normalizePath(rootPath);
    const prefix = normalizedRoot ? `${normalizedRoot}/` : "";
    const edges: Edge<string>[] = [];

    const allPaths = new Set([...this.directories, ...this.files.keys()]);

    for (const path of allPaths) {
      if (path && (normalizedRoot === "" || path.startsWith(prefix))) {
        const lastSlashIndex = path.lastIndexOf("/");
        const parentPath =
          lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : "";

        if (
          normalizedRoot === "" ||
          parentPath.startsWith(normalizedRoot) ||
          parentPath === normalizedRoot
        ) {
          edges.push({
            source: parentPath || "/",
            target: path,
          });
        }
      }
    }

    return edges;
  }

  async list(directoryPath: string): Promise<FileInfo[]> {
    const normalizedDir = this.normalizePath(directoryPath);
    const prefix = normalizedDir ? `${normalizedDir}/` : "";
    const resultMap = new Map<string, FileInfo>();

    const checkItem = (path: string, isDir: boolean) => {
      if (path.startsWith(prefix) && path !== normalizedDir) {
        const relativePath = path.substring(prefix.length);
        const parts = relativePath.split("/");
        const isImmediateChild = parts.length === 1;

        if (isImmediateChild) {
          resultMap.set(path, {
            name: parts[0],
            path: path,
            isDirectory: isDir,
          });
        } else {
          const childDirName = parts[0];
          const childDirPath = prefix + childDirName;
          if (!resultMap.has(childDirPath)) {
            resultMap.set(childDirPath, {
              name: childDirName,
              path: childDirPath,
              isDirectory: true,
            });
          }
        }
      }
    };

    for (const p of this.files.keys()) checkItem(p, false);
    for (const p of this.directories) checkItem(p, true);

    return Array.from(resultMap.values());
  }

  clear() {
    this.files.clear();
    this.directories.clear();
    this.directories.add("");
  }
}
