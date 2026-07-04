import { describe, it, expect, beforeEach } from "vitest";
import { MockFileSystem } from "./mockFileSystem";
import type { RawContainerObject } from "@/core/infra/storage/type";
import { ObjectStorageRepository } from "@/core/infra/storage/objectsRepository";

describe("ObjectStorageRepository", () => {
  let mockFs: MockFileSystem<RawContainerObject>;
  let repository: ObjectStorageRepository;

  beforeEach(async () => {
    mockFs = new MockFileSystem();
    repository = new ObjectStorageRepository(mockFs);
    await repository.init();
  });

  it("should initialize the workspace root container", async () => {
    const root = await mockFs.get("./root.json");

    expect(root).toBeDefined();
    expect(root?.id).toBe("-1");
    expect(root?.typeId).toBe("sys:workspace");
  });
});
