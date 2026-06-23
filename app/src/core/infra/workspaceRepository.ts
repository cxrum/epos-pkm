import type { FileSystemApi } from "../../../fileSystemApiContract";
import type { WorkspaceRepositoryContract } from "../domain/repositories/workspaceRepository";
import type { WorkspaceLocalConfigEntity } from "../domain/workspace";
import type { AppStateRepository } from "./stateRepository";

export class WorkspaceStateRepository implements WorkspaceRepositoryContract {
  private readonly fileSystemApi: FileSystemApi<WorkspaceLocalConfigEntity>;
  private readonly appStateRepository: AppStateRepository;

  private readonly PATH: string = "./.workspace";

  constructor(
    userStorageApi: FileSystemApi<WorkspaceLocalConfigEntity>,
    appStateRepository: AppStateRepository,
  ) {
    this.fileSystemApi = userStorageApi;
    this.appStateRepository = appStateRepository;
  }
  async init(): Promise<void> {
    await this.load();
  }

  async load(): Promise<WorkspaceLocalConfigEntity> {
    let root = await this.fileSystemApi.get(this.PATH);
    if (!root) {
      throw Error();
    }
    console.log(root);

    return root;
  }

  async save(data: WorkspaceLocalConfigEntity): Promise<void> {
    await this.fileSystemApi.save(this.PATH, data);
  }
}
