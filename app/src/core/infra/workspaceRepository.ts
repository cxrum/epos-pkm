import type { FileSystemApi } from "../../../fileSystemApiContract";
import type { WorkspaceSelection } from "../../../appState";
import type { WorkspaceRepositoryContract } from "../domain/repositories/workspaceRepository";
import type {
  SavedTab,
  WorkspaceLocalConfigEntity,
  WorkspaceLocalState,
} from "../domain/workspace";
import { IpcFileSystem } from "./storage/storageRepository";

export class WorkspaceStateRepository implements WorkspaceRepositoryContract {
  private readonly getSelectedWorkspace:
    | (() => Promise<WorkspaceSelection | undefined>)
    | (() => WorkspaceSelection | undefined);
  private readonly PATH: string = ".workspace";

  private config: WorkspaceLocalConfigEntity | undefined;

  constructor(
    getSelectedWorkspace:
      | (() => Promise<WorkspaceSelection | undefined>)
      | (() => WorkspaceSelection | undefined),
  ) {
    this.getSelectedWorkspace = getSelectedWorkspace;
  }
  getDefaultWorkspaceState = (): WorkspaceLocalState => ({
    savedTabs: [],
    lastActiveTab: undefined,
  });

  private async getFileSystemApi(): Promise<
    FileSystemApi<WorkspaceLocalConfigEntity>
  > {
    const selectedWorkspace = await this.getSelectedWorkspace();
    if (!selectedWorkspace?.relativePath) {
      throw Error("Workspace not selected");
    }

    return new IpcFileSystem<WorkspaceLocalConfigEntity>(
      selectedWorkspace.relativePath,
    );
  }

  async load(): Promise<WorkspaceLocalConfigEntity> {
    const fileSystemApi = await this.getFileSystemApi();
    let root = await fileSystemApi.get(this.PATH);

    if (!root) {
      throw Error("Workspace config not found");
    }

    root.state = {
      ...this.getDefaultWorkspaceState(),
      ...(root.state || {}),
    };

    this.config = root;
    return root;
  }
  async sync(): Promise<void> {
    if (!this.config) {
      this.config = await this.load();
    }
    const fileSystemApi = await this.getFileSystemApi();
    await fileSystemApi.save(this.PATH, this.config);
    this.config = await this.load();
  }

  async init(): Promise<void> {
    await this.sync();
  }

  async get(): Promise<WorkspaceLocalConfigEntity> {
    if (this.config) {
      return this.config;
    }
    return await this.load();
  }

  async saveState(data: WorkspaceLocalState): Promise<void> {
    const conf = await this.get();
    conf.state = data;
    this.config = conf;
    await this.sync();
  }

  async saveTabs(data: SavedTab[]): Promise<void> {
    const conf = await this.get();
    conf.state.savedTabs = data;
    this.config = conf;
    await this.sync();
  }

  async saveLastActiveTab(data: SavedTab): Promise<void> {
    const conf = await this.get();
    conf.state.lastActiveTab = data;
    this.config = conf;
    await this.sync();
  }
}
