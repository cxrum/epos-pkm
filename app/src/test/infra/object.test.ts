import { describe, it, expect, beforeEach, vi } from "vitest";
import { MockFileSystem } from "./mockFileSystem";
import type { RawContainerObject } from "@/core/infra/storage/type";
import { ObjectStorageRepository } from "@/core/infra/storage/objectsRepository";

describe("ObjectsStorgaeRepository", () => {
  let mockFs: MockFileSystem<RawContainerObject>;
  let repository: ObjectStorageRepository;

  beforeEach(async () => {
    mockFs = new MockFileSystem();
    repository = new ObjectStorageRepository(mockFs);
    await repository.init();
  });

  describe("Cache and validation failures", () => {
    it("should return false if movedId is missing in objectPathCache", async () => {
      repository.objectPathCache.set("validParentId", "folder/parent.json");
      
      const result = await repository.move("missingMovedId", "validParentId");
      
      expect(result).toBe(false);
    });

    it("should return false if parentId is missing in objectPathCache", async () => {
      repository.objectPathCache.set("validMovedId", "folder/moved.json");
      
      const result = await repository.move("validMovedId", "missingParentId");
      
      expect(result).toBe(false);
    });

    it("should return false if movedId is missing in fileTreeCache", async () => {
      repository.objectPathCache.set("movedId", "folder/moved.json");
      repository.objectPathCache.set("parentId", "folder/parent.json");
      
      const result = await repository.move("movedId", "parentId");
      
      expect(result).toBe(false);
    });
  });

  describe("Container objects move logic", () => {
  beforeEach(() => {
    repository.objectPathCache.set("containerId", "old-folder/doc.json");
    repository.objectPathCache.set("parentId", "new-folder/parent.json");
    repository.fileTreeCache.set("containerId", {
      properties: { isContainer: { value: true } }
    } as any);
  });

  it("should return true and move files", async () => {
    repository.objectPathCache.set("parentId", "old-folder/parent.json");
    vi.spyOn(mockFs, "move");
    vi.spyOn(repository, "index");

    const result = await repository.move("containerId", "parentId");

    expect(result).toBe(true);
    expect(mockFs.move).toHaveBeenCalledOnce();
    expect(repository.index).toHaveBeenCalledOnce();
  });

  it("should move json file but skip folder if associated folder does not exist", async () => {
    vi.spyOn(mockFs, "exists").mockResolvedValue(false);
    vi.spyOn(mockFs, "move").mockResolvedValue(true);

    const result = await repository.move("containerId", "parentId");

    expect(result).toBe(true);
    expect(mockFs.move).toHaveBeenCalledTimes(1);
    expect(mockFs.move).toHaveBeenCalledWith("old-folder/doc.json", "new-folder/parent/doc.json");
  });

  it("should move both json file and associated folder if folder exists", async () => {
    vi.spyOn(mockFs, "exists").mockResolvedValue(true);
    vi.spyOn(mockFs, "move").mockResolvedValue(true);

    const result = await repository.move("containerId", "parentId");

    expect(result).toBe(true);
    expect(mockFs.move).toHaveBeenCalledTimes(2);
    expect(mockFs.move).toHaveBeenCalledWith("old-folder/doc.json", "new-folder/parent/doc.json");
    expect(mockFs.move).toHaveBeenCalledWith("old-folder/doc", "new-folder/parent/doc");
  });
});

describe("Inline objects move logic", () => {
  beforeEach(() => {
    repository.objectPathCache.set("inlineId", "old-folder/parent1.json");
    repository.objectPathCache.set("newParentId", "new-folder/parent2.json");
    repository.fileTreeCache.set("inlineId", {
      properties: { isContainer: { value: false } }
    } as any);
  });

  it("should short-circuit and return true if moving to the same container", async () => {
    repository.objectPathCache.set("newParentId", "old-folder/parent1.json");
    vi.spyOn(mockFs, "get");

    const result = await repository.move("inlineId", "newParentId");

    expect(result).toBe(true);
    expect(mockFs.get).not.toHaveBeenCalled();
  });

  it("should return false if old container file is missing on disk", async () => {
    vi.spyOn(mockFs, "get").mockResolvedValueOnce(null);

    const result = await repository.move("inlineId", "newParentId");

    expect(result).toBe(false);
  });

  it("should return false if inlineId does not exist in old container content", async () => {
    vi.spyOn(mockFs, "get").mockResolvedValueOnce({ content: {} });
    vi.spyOn(mockFs, "get").mockResolvedValueOnce({ content: {} });

    const result = await repository.move("inlineId", "newParentId");

    expect(result).toBe(false);
  });

  it("should safely create content and order objects in new container if they are undefined", async () => {
    const mockObj = { id: "inlineId", data: "test" };

    vi.spyOn(mockFs, "get").mockResolvedValueOnce({
      content: { inlineId: mockObj },
      order: ["inlineId"]
    });
    vi.spyOn(mockFs, "get").mockResolvedValueOnce({});
    vi.spyOn(mockFs, "save");

    const result = await repository.move("inlineId", "newParentId");

    expect(result).toBe(true);
    expect(mockFs.save).toHaveBeenLastCalledWith("new-folder/parent2.json", {
      content: { inlineId: mockObj },
      order: ["inlineId"]
    });
  });

  it("should successfully remove from old container and add to new container", async () => {
    const mockObj = { id: "inlineId", data: "test" };

    vi.spyOn(mockFs, "get").mockResolvedValueOnce({
      content: { inlineId: mockObj, otherId: {} },
      order: ["otherId", "inlineId"]
    });
    vi.spyOn(mockFs, "get").mockResolvedValueOnce({
      content: { existingId: {} },
      order: ["existingId"]
    });
    vi.spyOn(mockFs, "save");
    vi.spyOn(repository, "index");

    const result = await repository.move("inlineId", "newParentId");

    expect(result).toBe(true);
    expect(mockFs.save).toHaveBeenCalledWith("old-folder/parent1.json", {
      content: { otherId: {} },
      order: ["otherId"]
    });
    expect(mockFs.save).toHaveBeenCalledWith("new-folder/parent2.json", {
      content: { existingId: {}, inlineId: mockObj },
      order: ["existingId", "inlineId"]
    });
    expect(repository.index).toHaveBeenCalledTimes(1);
  });
});

})