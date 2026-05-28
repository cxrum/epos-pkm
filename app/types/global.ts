export interface SystemApi {
  readFile: (filePath: string) => Promise<string>;
  saveFile: (filePath: string, data: string) => Promise<boolean>;
}

declare global {
  interface Window {
    systemApi: SystemApi;
  }
}