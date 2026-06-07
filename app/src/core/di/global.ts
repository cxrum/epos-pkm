import { ObjectsService } from "@/core/application/objectsService";
import { TypingService } from "@/core/application/typingService";
import { ObjectStorageRepository } from "@/core/infra/storage/objectsRepository";
import { TypingRepository } from "@/core/infra/storage/typeRepository";
import { IpcFileSystem } from "../infra/storage/storageRepository";
import type { RawContainerObject, RawEpType } from "../infra/storage/type";

const containerObjectStorageApi = new IpcFileSystem<RawContainerObject>();
const typesStorageApi = new IpcFileSystem<RawEpType>();

const typingRepository = new TypingRepository(typesStorageApi);
const objectRepository = new ObjectStorageRepository(containerObjectStorageApi);

export const globalTypingService = new TypingService(typingRepository);
export const globalObjectsService = new ObjectsService(
  typingRepository,
  objectRepository,
);
