import { ObjectsService } from "@/core/application/objectsService";
import { TypingService } from "@/core/application/typingService";
import { ObjectStorageRepository } from "@/core/infra/storage/objectsRepository";
import { TypingRepository } from "@/core/infra/storage/typeRepository";
import { IpcFileSystem } from "../infra/storage/storageRepository";
import type {
  RawContainerObject,
  RawEptTypeHierarchyNode,
} from "../infra/storage/type";

const containerObjectStorageApi = new IpcFileSystem<RawContainerObject>(
  "/workspace",
);
const typesStorageApi = new IpcFileSystem<RawEptTypeHierarchyNode>("/types");

const typingRepository = new TypingRepository(typesStorageApi);
await typingRepository.init();
const objectRepository = new ObjectStorageRepository(containerObjectStorageApi);
await objectRepository.init();

export const globalTypingService = new TypingService(typingRepository);
export const globalObjectsService = new ObjectsService(
  typingRepository,
  objectRepository,
);
