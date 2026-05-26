
export interface FileSystemContract {
  readFile(path: string): Promise<string>;
  saveFile(path: string, content: string): Promise<boolean>;
}