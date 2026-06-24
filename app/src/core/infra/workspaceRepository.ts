import type { FileSystemApi } from "../../../fileSystemApiContract";
import type { WorkspaceRepositoryContract } from "../domain/repositories/workspaceRepository";
import type {
  SavedTab,
  WorkspaceLocalConfigEntity,
  WorkspaceLocalState,
} from "../domain/workspace";

export class WorkspaceStateRepository implements WorkspaceRepositoryContract {
  private readonly fileSystemApi: FileSystemApi<WorkspaceLocalConfigEntity>;
  private readonly PATH: string = "./.workspace";

  private config: WorkspaceLocalConfigEntity | undefined;

  constructor(userStorageApi: FileSystemApi<WorkspaceLocalConfigEntity>) {
    this.fileSystemApi = userStorageApi;
  }
  getDefaultWorkspaceState = (): WorkspaceLocalState => ({
    savedTabs: [],
    lastActiveTab: undefined,
  });

  async load(): Promise<WorkspaceLocalConfigEntity> {
    let root = await this.fileSystemApi.get(this.PATH);

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
    await this.fileSystemApi.save(this.PATH, this.config);
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
