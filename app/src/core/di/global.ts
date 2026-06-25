import { ObjectsService } from "@/core/application/objectsService";
import { TypingService } from "@/core/application/typingService";
import { ObjectStorageRepository } from "@/core/infra/storage/objectsRepository";
import { TypingRepository } from "@/core/infra/storage/typeRepository";
import { IpcFileSystem } from "../infra/storage/storageRepository";
import type {
  RawContainerObject,
  RawEptTypeHierarchyNode,
} from "../infra/storage/type";
import { AppStateRepository } from "../infra/stateRepository";
import { WorkspaceStateRepository } from "../infra/workspaceRepository";
import type { WorkspaceLocalConfigEntity } from "../domain/workspace";
import { SystemRoot } from "./type";

const containerObjectStorageApi = new IpcFileSystem<RawContainerObject>(
  "/workspace",
);
const workspaceStateApi = new IpcFileSystem<WorkspaceLocalConfigEntity>(
  undefined,
);
const typesStorageApi = new IpcFileSystem<RawEptTypeHierarchyNode>("/types");

export const appStateRepository = new AppStateRepository();
export const workspaceStateRepository = new WorkspaceStateRepository(
  workspaceStateApi,
);

const typingRepository = new TypingRepository(typesStorageApi, SystemRoot());
const objectRepository = new ObjectStorageRepository(containerObjectStorageApi);

export async function bootstrapWorkspaceServices() {
  await workspaceStateRepository.init();
  await typingRepository.init();
  await objectRepository.init();
}

export const globalTypingService = new TypingService(typingRepository);
export const globalObjectsService = new ObjectsService(
  typingRepository,
  objectRepository,
);
