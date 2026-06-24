import type { FileSystemApi } from "../../../fileSystemApiContract";
import type { WorkspaceRepositoryContract } from "../domain/repositories/workspaceRepository";
import type { SavedTab, WorkspaceLocalConfigEntity } from "../domain/workspace";

export class WorkspaceStateRepository implements WorkspaceRepositoryContract {
  private readonly fileSystemApi: FileSystemApi<WorkspaceLocalConfigEntity>;
  private readonly PATH: string = "./.workspace";

  private config: WorkspaceLocalConfigEntity | undefined;

  constructor(userStorageApi: FileSystemApi<WorkspaceLocalConfigEntity>) {
    this.fileSystemApi = userStorageApi;
  }

  async load(): Promise<WorkspaceLocalConfigEntity> {
    let root = await this.fileSystemApi.get(this.PATH);
    if (!root) {
      throw Error();
    }
    this.config = root;
    return root;
  }

  async init(): Promise<void> {
    await this.load();
  }

  async get(): Promise<WorkspaceLocalConfigEntity> {
    if (this.config) {
      return this.config;
    }
    return await this.load();
  }

  async save(data: WorkspaceLocalConfigEntity): Promise<void> {
    await this.fileSystemApi.save(this.PATH, data);
    this.config = await this.load();
  }

  async saveTabs(data: SavedTab[]): Promise<void> {
    const conf = await this.get();
    conf.savedTabs = data;
    await this.save(conf);
  }
}
