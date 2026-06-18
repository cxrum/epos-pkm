import { describe, it, expect, beforeEach } from "vitest";
import type { UserTypeEntity } from "@/core/domain/type";
import { MockFileSystem } from "./mockFileSystem";
import type { RawEptTypeHierarchyNode } from "@/core/infra/storage/type";
import { TypingRepository } from "@/core/infra/storage/typeRepository";

describe("TypingRepository", () => {
  let mockFs: MockFileSystem<RawEptTypeHierarchyNode>;
  let repository: TypingRepository;

  beforeEach(async () => {
    mockFs = new MockFileSystem();
    repository = new TypingRepository(mockFs);
    await repository.init();
  });

  describe("Initialization & Fetching", () => {
    it("should initialize and load default root type", async () => {
      const rootType = await repository.get("sys:root");

      expect(rootType).toBeDefined();
      expect(rootType?.id).toBe("sys:root");
    });

    it("should return all flat types", async () => {
      const allTypes = await repository.getAll();

      expect(allTypes.length).toBeGreaterThan(0);
      expect(allTypes.some((t) => t.id === "sys:root")).toBe(true);
    });

    it("should return full tree", async () => {
      const tree = await repository.getTree();

      expect(tree).toBeDefined();
      expect(tree.id).toBe("sys:root");
    });
  });

  describe("Create & Update", () => {
    it("should create a new user type under root", async () => {
      const newTypeData: Omit<UserTypeEntity, "kind"> = {
        id: "usr:test-type",
        title: "Test Type",
        icon: { type: "default", name: "test" },
        propertiesScheme: { order: [], props: {} },
      };

      const created = await repository.create(newTypeData, "sys:root");

      expect(created.id).toBe("usr:test-type");
      expect(created.kind).toBe("user");

      const fetched = await repository.get("usr:test-type");
      expect(fetched).toBeDefined();
      expect(fetched?.title).toBe("Test Type");
    });

    it("should update an existing user type", async () => {
      const newTypeData: Omit<UserTypeEntity, "kind"> = {
        id: "usr:update-type",
        title: "Initial Title",
        icon: { type: "default", name: "test" },
        propertiesScheme: { order: [], props: {} },
      };

      await repository.create(newTypeData, "sys:root");

      const updateData: UserTypeEntity = {
        ...newTypeData,
        kind: "user",
        title: "Updated Title",
      };

      const updated = await repository.update("usr:update-type", updateData);

      expect(updated?.title).toBe("Updated Title");

      const fetched = await repository.get("usr:update-type");
      expect(fetched?.title).toBe("Updated Title");
    });
  });

  describe("Remove & Structure", () => {
    it("should remove a type that has no descendants", async () => {
      const newTypeData: Omit<UserTypeEntity, "kind"> = {
        id: "usr:remove-type",
        title: "To Remove",
        icon: { type: "default", name: "test" },
        propertiesScheme: { order: [], props: {} },
      };

      await repository.create(newTypeData, "sys:root");

      const isRemoved = await repository.remove("usr:remove-type");
      expect(isRemoved).toBe(true);

      const fetched = await repository.get("usr:remove-type");
      expect(fetched).toBeUndefined();
    });

    it("should not remove a type if it has descendants", async () => {
      const parentData: Omit<UserTypeEntity, "kind"> = {
        id: "usr:parent",
        title: "Parent",
        icon: { type: "default", name: "test" },
        propertiesScheme: { order: [], props: {} },
      };
      const childData: Omit<UserTypeEntity, "kind"> = {
        id: "usr:child",
        title: "Child",
        icon: { type: "default", name: "test" },
        propertiesScheme: { order: [], props: {} },
      };

      await repository.create(parentData, "sys:root");
      await repository.create(childData, "usr:parent");

      const isRemoved = await repository.remove("usr:parent");
      expect(isRemoved).toBe(false);

      const fetched = await repository.get("usr:parent");
      expect(fetched).toBeDefined();
    });

    it("should move child to a new parent via inherit", async () => {
      const parent1Data: Omit<UserTypeEntity, "kind"> = {
        id: "usr:p1",
        title: "Parent 1",
        icon: { type: "default", name: "test" },
        propertiesScheme: { order: [], props: {} },
      };
      const parent2Data: Omit<UserTypeEntity, "kind"> = {
        id: "usr:p2",
        title: "Parent 2",
        icon: { type: "default", name: "test" },
        propertiesScheme: { order: [], props: {} },
      };
      const childData: Omit<UserTypeEntity, "kind"> = {
        id: "usr:c1",
        title: "Child",
        icon: { type: "default", name: "test" },
        propertiesScheme: { order: [], props: {} },
      };

      await repository.create(parent1Data, "sys:root");
      await repository.create(parent2Data, "sys:root");
      await repository.create(childData, "usr:p1");

      const isMoved = await repository.inherit("usr:p2", "usr:c1");
      expect(isMoved).toBe(true);

      const descendantsP2 = repository.getDescendants("usr:p2");
      expect(descendantsP2).toContain("usr:c1");

      const descendantsP1 = repository.getDescendants("usr:p1");
      expect(descendantsP1).not.toContain("usr:c1");
    });
  });
});
