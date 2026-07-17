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
import { AuthRepository } from "../infra/authRepository";
import { WorkspaceStateRepository } from "../infra/workspaceRepository";
import { TypeRegister } from "../infra/typeRegister";
import { bootstrapTypeRegistry } from "./type";

const containerObjectStorageApi = new IpcFileSystem<RawContainerObject>(
  () => appStateRepository.getSelectedWorkspace().then((workspace) => workspace?.relativePath),
);
const typesStorageApi = new IpcFileSystem<RawEptTypeHierarchyNode>("/types");

export const appStateRepository = new AppStateRepository();
export const authRepository = new AuthRepository();
export const workspaceStateRepository = new WorkspaceStateRepository(
  () => appStateRepository.getSelectedWorkspace(),
);

const typeRegister = new TypeRegister();
bootstrapTypeRegistry(typeRegister);

const typingRepository = new TypingRepository(
  typesStorageApi,
  typeRegister.systemRoot(),
);
const objectRepository = new ObjectStorageRepository(containerObjectStorageApi);

export async function bootstrapWorkspaceServices() {
  await workspaceStateRepository.init();
  await typingRepository.init();
  await objectRepository.init();
}

export async function refreshWorkspaceContent() {
  await typingRepository.init();
  await objectRepository.init();
}

export const globalTypingService = new TypingService(typingRepository);
export const globalObjectsService = new ObjectsService(
  typingRepository,
  objectRepository,
);
