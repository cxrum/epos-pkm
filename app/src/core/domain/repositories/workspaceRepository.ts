import type { WorkspaceLocalConfigEntity } from "../workspace";

export interface WorkspaceRepositoryContract {
  init(): Promise<void>;
  load(): Promise<WorkspaceLocalConfigEntity>;
  save(data: WorkspaceLocalConfigEntity): Promise<void>;
}
