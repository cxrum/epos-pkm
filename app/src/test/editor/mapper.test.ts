import { describe, it, expect, vi, beforeEach } from "vitest";
import { entitiesToTiptapDoc } from "@/modules/page/components/editor/mappers";
import * as helpers from "@/modules/page/components/editor/helpers";

vi.mock("@/modules/page/components/editor/helpers", () => ({
  mapEpTypeToTiptapType: vi.fn(),
  isHeadingInlineEntity: vi.fn(),
}));

describe("entitiesToTiptapDoc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return an empty doc when order is empty", () => {
    const result = entitiesToTiptapDoc({}, []);

    expect(result).toEqual({
      type: "doc",
      content: [],
    });
  });

  it("should ignore IDs in order array that do not exist in the record", () => {
    const entities = {
      "id-1": {
        id: "id-1",
        typeId: "def:text",
        props: {},
        content: "text",
        physicalRelativePath: "",
        objectPath: [],
      } as any,
    };

    vi.mocked(helpers.mapEpTypeToTiptapType).mockReturnValue("paragraph");

    const result = entitiesToTiptapDoc(entities, ["id-1", "id-2"]);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].attrs?.id).toBe("id-1");
  });

  it("should map a standard text entity to a paragraph with text content", () => {
    const entities = {
      "text-1": {
        id: "text-1",
        typeId: "def:text",
        props: {},
        content: "Hello World",
        physicalRelativePath: "path/to/file",
        objectPath: ["parent-1"],
      } as any,
    };

    vi.mocked(helpers.mapEpTypeToTiptapType).mockReturnValue("paragraph");

    const result = entitiesToTiptapDoc(entities, ["text-1"]);

    expect(helpers.mapEpTypeToTiptapType).toHaveBeenCalledWith("def:text");
    expect(result.content[0]).toEqual({
      type: "paragraph",
      attrs: {
        id: "text-1",
        typeId: "def:text",
        physicalRelativePath: "path/to/file",
        objectPath: ["parent-1"],
        props: {},
      },
      content: [{ type: "text", text: "Hello World" }],
    });
  });

  it("should map a heading entity and extract the level from props", () => {
    const entities = {
      "heading-1": {
        id: "heading-1",
        typeId: "def:heading",
        props: {
          level: { value: 2 },
        },
        content: "Section Title",
        physicalRelativePath: "",
        objectPath: [],
      } as any,
    };

    vi.mocked(helpers.mapEpTypeToTiptapType).mockReturnValue("heading");
    vi.mocked(helpers.isHeadingInlineEntity).mockReturnValue(true);

    const result = entitiesToTiptapDoc(entities, ["heading-1"]);

    expect(result.content[0].attrs?.level).toBe(2);
    expect(result.content[0].content).toEqual([
      { type: "text", text: "Section Title" },
    ]);
  });

  it("should map a custom block and set domainContent instead of standard content", () => {
    const entities = {
      "custom-1": {
        id: "custom-1",
        typeId: "def:hardlink",
        props: {},
        content: { linkId: "123", label: "Click here" },
        physicalRelativePath: "",
        objectPath: [],
      } as any,
    };

    vi.mocked(helpers.mapEpTypeToTiptapType).mockReturnValue("epBlock");

    const result = entitiesToTiptapDoc(entities, ["custom-1"]);

    expect(result.content[0].type).toBe("epBlock");
    expect(result.content[0].content).toBeUndefined();
    expect(result.content[0].attrs?.domainContent).toEqual({
      linkId: "123",
      label: "Click here",
    });
  });

  it("should correctly map array content", () => {
    const arrayContent = [
      { type: "text", text: "Part 1" },
      { type: "text", text: "Part 2" },
    ];
    const entities = {
      "array-1": {
        id: "array-1",
        typeId: "def:list",
        props: {},
        content: arrayContent,
        physicalRelativePath: "",
        objectPath: [],
      } as any,
    };

    vi.mocked(helpers.mapEpTypeToTiptapType).mockReturnValue("bulletList");

    const result = entitiesToTiptapDoc(entities, ["array-1"]);

    expect(result.content[0].content).toEqual(arrayContent);
  });

  it("should correctly extract values if content is an object but not a custom block", () => {
    const objectContent = {
      key1: { type: "text", text: "Val 1" },
      key2: { type: "text", text: "Val 2" },
    };
    const entities = {
      "obj-1": {
        id: "obj-1",
        typeId: "def:unknown",
        props: {},
        content: objectContent,
        physicalRelativePath: "",
        objectPath: [],
      } as any,
    };

    vi.mocked(helpers.mapEpTypeToTiptapType).mockReturnValue("paragraph");

    const result = entitiesToTiptapDoc(entities, ["obj-1"]);

    expect(result.content[0].content).toEqual([
      { type: "text", text: "Val 1" },
      { type: "text", text: "Val 2" },
    ]);
  });
});
