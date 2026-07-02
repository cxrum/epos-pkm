import type { Edge } from "@/core/infra/utils";

export interface FileInfo {
  path: string;
  ext?: string;
  dir: string;
  name: string;
}

export interface FileSystemApi<T = unknown> {
  get(path: string): Promise<T | undefined>;
  save(path: string, data: T): Promise<void>;
  move(sourcePath: string, destinationPath: string): Promise<void>;
  remove(path: string): Promise<void>;
  rename(path: string, newPath: string): Promise<boolean>;
  exists(path: string): Promise<boolean>;
  isDirectory(path: string): Promise<boolean>;
  list(directoryPath: string): Promise<FileInfo[]>;

  tree(rootPath: string): Promise<Edge<string>[]>;
  getAllFlat(rootPath: string): Promise<Record<string, T>>;

  join(basePath: string | undefined, targetPath: string | undefined): Promise<string>
  parse(targetPath: string): Promise<FileInfo>
  renameFile(filePath: string, newTitle: string): Promise<string>
  relative(fromPath: string, toPath: string): Promise<string>
}
