import { describe, it, expect } from "vitest";
import {
  isMountedContainerEntity,
  isContainerEntity,
  isWorkspaceEntity,
  isSystemInlineEntity,
  isHeadingInlineEntity,
  isAnyText,
  isAnyInlineEntity,
  isAnyContainer,
} from "@/core/domain/type";

const mockMountedContainer = {
  id: "1",
  typeId: "sys:hard-page-link",
  props: { isContainer: { value: false } },
} as any;

const mockSystemContainer = {
  id: "2",
  typeId: "sys:container",
  props: { isContainer: { value: true } },
} as any;

const mockWorkspace = {
  id: "3",
  typeId: "sys:workspace",
  props: { isContainer: { value: true } },
} as any;

const mockStandardInline = {
  id: "4",
  typeId: "sys:any",
  props: { isContainer: { value: false } },
} as any;

const mockHeading = {
  id: "5",
  typeId: "def:heading",
  props: { isContainer: { value: false }, level: { value: 2 } },
} as any;

const mockText = {
  id: "6",
  typeId: "def:text",
  props: { isContainer: { value: false } },
} as any;

const mockCustomInline = {
  id: "7",
  typeId: "usr:my-custom-block",
  props: { isContainer: { value: false } },
} as any;

const mockCustomContainer = {
  id: "8",
  typeId: "usr:my-custom-folder",
  props: { isContainer: { value: true } },
} as any;

describe("Entity Type Guards", () => {
  describe("isMountedContainerEntity", () => {
    it("should return true for sys:hard-page-link", () => {
      expect(isMountedContainerEntity(mockMountedContainer)).toBe(true);
    });
    it("should return false for others", () => {
      expect(isMountedContainerEntity(mockSystemContainer)).toBe(false);
      expect(isMountedContainerEntity(mockHeading)).toBe(false);
    });
  });

  describe("isContainerEntity", () => {
    it("should return true for sys:container", () => {
      expect(isContainerEntity(mockSystemContainer)).toBe(true);
    });
    it("should return false for others", () => {
      expect(isContainerEntity(mockWorkspace)).toBe(false);
      expect(isContainerEntity(mockCustomContainer)).toBe(false);
      expect(isContainerEntity(mockHeading)).toBe(false);
    });
  });

  describe("isWorkspaceEntity", () => {
    it("should return true for sys:workspace", () => {
      expect(isWorkspaceEntity(mockWorkspace)).toBe(true);
    });
    it("should return false for others", () => {
      expect(isWorkspaceEntity(mockSystemContainer)).toBe(false);
    });
  });

  describe("isSystemInlineEntity", () => {
    it("should return true if isContainer is false and type is not hard-page-link", () => {
      expect(isSystemInlineEntity(mockStandardInline)).toBe(true);
      expect(isSystemInlineEntity(mockHeading)).toBe(true);
    });
    it("should return false if it is a hard-page-link", () => {
      expect(isSystemInlineEntity(mockMountedContainer)).toBe(false);
    });
    it("should return false if it is a container", () => {
      expect(isSystemInlineEntity(mockSystemContainer)).toBe(false);
    });
  });

  describe("isHeadingInlineEntity", () => {
    it("should return true for def:heading", () => {
      expect(isHeadingInlineEntity(mockHeading)).toBe(true);
    });
    it("should return false for def:text or others", () => {
      expect(isHeadingInlineEntity(mockText)).toBe(false);
      expect(isHeadingInlineEntity(mockStandardInline)).toBe(false);
    });
  });

  describe("isAnyText", () => {
    it("should return true for def:text and def:heading", () => {
      expect(isAnyText(mockText)).toBe(true);
      expect(isAnyText(mockHeading)).toBe(true);
    });
    it("should return false for others", () => {
      expect(isAnyText(mockStandardInline)).toBe(false);
    });
  });

  describe("isAnyInlineEntity", () => {
    it("should return true for inline entities that are not hard-page-link", () => {
      expect(isAnyInlineEntity(mockStandardInline)).toBe(true);
      expect(isAnyInlineEntity(mockCustomInline)).toBe(true);
      expect(isAnyInlineEntity(mockHeading)).toBe(true);
    });
    it("should return false for hard-page-link", () => {
      expect(isAnyInlineEntity(mockMountedContainer)).toBe(false);
    });
    it("should return false for containers", () => {
      expect(isAnyInlineEntity(mockSystemContainer)).toBe(false);
      expect(isAnyInlineEntity(mockCustomContainer)).toBe(false);
    });
  });

  describe("isAnyContainer", () => {
    it("should return true if isContainer.value is true", () => {
      expect(isAnyContainer(mockSystemContainer)).toBe(true);
      expect(isAnyContainer(mockWorkspace)).toBe(true);
      expect(isAnyContainer(mockCustomContainer)).toBe(true);
    });
    it("should return false if isContainer.value is false", () => {
      expect(isAnyContainer(mockStandardInline)).toBe(false);
      expect(isAnyContainer(mockMountedContainer)).toBe(false);
      expect(isAnyContainer(mockHeading)).toBe(false);
    });

    it("should handle missing props safely", () => {
      const brokenEntity = { id: "9", typeId: "broken", props: {} } as any;
      expect(() => isAnyContainer(brokenEntity)).toThrowError();
    });
  });
});
