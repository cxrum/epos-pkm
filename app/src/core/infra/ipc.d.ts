import type { AppStateApi } from "../../../appState";
import type { AuthApi } from "../../../authApi";
import type { FileSystemApi } from "../../../fileSystemApiContract";

declare global {
  interface Window {
    electronFs: FileSystemApi;
    appState: AppStateApi;
    authApi: AuthApi;
    electronAPI: {
      selectDirectory: () => Promise<string | null>;
    };
  }
}
