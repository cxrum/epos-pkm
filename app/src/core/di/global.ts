import { ObjectsService } from "@/core/application/objectsService";
import { TypingService } from "@/core/application/typingService";
import { ObjectStorageRepository } from "@/core/infra/storage/objectsRepository";
import { TypingRepository } from "@/core/infra/storage/typeRepository";

const typingRepository = new TypingRepository();
const objectRepository = new ObjectStorageRepository();

export const globalTypingService = new TypingService(typingRepository);
export const globalObjectsService = new ObjectsService(
  typingRepository,
  objectRepository,
);
