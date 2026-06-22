import type { AppStateApi } from "../../../appState";
import type { FileSystemApi } from "../../../fileSystemApiContract";

declare global {
  interface Window {
    electronFs: FileSystemApi;
    appState: AppStateApi;
    electronAPI: {
      selectDirectory: () => Promise<string | null>;
    };
  }
}
