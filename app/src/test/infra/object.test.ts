import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockFileSystem } from "./mockFileSystem";
import type { RawContainerObject } from "@/core/infra/storage/type";
import { ObjectStorageRepository } from "@/core/infra/storage/objectsRepository";

describe("TypingRepository", () => {
  let mockFs: MockFileSystem<RawContainerObject>;
  let repository: ObjectStorageRepository;

  beforeEach(async () => {
    mockFs = new MockFileSystem();
    repository = new ObjectStorageRepository(mockFs);
    await repository.init();
  });

})