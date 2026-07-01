import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { entitiesToTiptapDoc, tiptapDocToEntities } from "@/modules/page/components/editor/mappers";
import * as helpers from "@/modules/page/components/editor/helpers";
import type { JSONContent } from "@tiptap/core";

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

describe("tiptapDocToEntities", () => {
  // Мокаємо генерацію UUID для передбачуваності в тестах
  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      value: {
        randomUUID: () => "mocked-uuid-1234",
      },
    });
  });

  describe("Base and Empty States", () => {
    it("should return empty order and content if tiptapDoc.content is undefined", () => {
      const doc: JSONContent = {};
      
      const result = tiptapDocToEntities(doc);
      
      expect(result).toEqual({ order: [], content: [] });
    });

    it("should return empty arrays if tiptapDoc.content is empty array", () => {
      const doc: JSONContent = { content: [] };
      
      const result = tiptapDocToEntities(doc);
      
      expect(result).toEqual({ order: [], content: [] });
    });
  });

  describe("ID Generation and Preservation", () => {
    it("should preserve existing ID from attrs", () => {
      const doc: JSONContent = {
        content: [{ type: "paragraph", attrs: { id: "existing-id-5678" } }],
      };
      
      const result = tiptapDocToEntities(doc);
      
      expect(result.order).toEqual(["existing-id-5678"]);
      expect(result.content[0].id).toBe("existing-id-5678");
    });

    it("should generate new UUID if attrs.id is missing", () => {
      const doc: JSONContent = {
        content: [{ type: "paragraph", attrs: {} }],
      };
      
      const result = tiptapDocToEntities(doc);
      
      expect(result.order).toEqual(["mocked-uuid-1234"]);
      expect(result.content[0].id).toBe("mocked-uuid-1234");
    });
  });

  describe("Text Blocks Processing (Paragraph & Heading)", () => {
    it("should process paragraph, set default typeId to 'def:text', and map text content", () => {
      const doc: JSONContent = {
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      };

      const result = tiptapDocToEntities(doc);

      expect(result.content[0].typeId).toBe("def:text");
      expect(result.content[0].content).toEqual([{ type: "text", text: "Hello world" }]);
      expect(result.content[0].props).toEqual({});
    });

    it("should process heading, set default typeId 'def:heading', and inject level property", () => {
      const doc: JSONContent = {
        content: [
          {
            type: "heading",
            attrs: { level: 2, props: { customProp: "value" } },
            content: [{ type: "text", text: "Title" }],
          },
        ],
      };

      const result = tiptapDocToEntities(doc);

      expect(result.content[0].typeId).toBe("def:heading");
      expect(result.content[0].content).toEqual([{ type: "text", text: "Title" }]);
      // Перевіряємо, що старі props збереглись, а level додався
      expect(result.content[0].props).toEqual({
        customProp: "value",
        level: {
          id: "level",
          title: "level",
          type: "number",
          value: 2,
        },
      });
    });

    it("should default heading level to 1 if not provided in attrs", () => {
      const doc: JSONContent = {
        content: [{ type: "heading", attrs: {} }],
      };

      const result = tiptapDocToEntities(doc);

      expect(result.content[0].props.level.value).toBe(1);
    });
    
    it("should not override typeId for text blocks if it is already provided", () => {
      const doc: JSONContent = {
        content: [
          { type: "paragraph", attrs: { typeId: "custom:text" } },
          { type: "heading", attrs: { typeId: "custom:heading" } }
        ],
      };

      const result = tiptapDocToEntities(doc);

      expect(result.content[0].typeId).toBe("custom:text");
      expect(result.content[1].typeId).toBe("custom:heading");
    });
  });

  describe("Custom Blocks (Non-text) Processing", () => {
    it("should map domainContent and specific attrs correctly for non-text blocks", () => {
      const doc: JSONContent = {
        content: [
          {
            type: "custom_widget",
            attrs: {
              id: "widget-1",
              typeId: "sys:widget",
              domainContent: { configuration: "data" },
              physicalRelativePath: "/assets/widget.json",
              objectPath: ["root", "folder"],
              props: { isReadonly: true },
            },
          },
        ],
      };

      const result = tiptapDocToEntities(doc);

      expect(result.order).toEqual(["widget-1"]);
      
      const entity = result.content[0];
      expect(entity.id).toBe("widget-1");
      expect(entity.typeId).toBe("sys:widget");
      // Перевіряємо, що взято domainContent, а не стандартний контент
      expect(entity.content).toEqual({ configuration: "data" }); 
      expect(entity.physicalRelativePath).toBe("/assets/widget.json");
      expect(entity.objectPath).toEqual(["root", "folder"]);
      expect(entity.props).toEqual({ isReadonly: true });
    });

    it("should handle missing attrs safely for custom blocks", () => {
      const doc: JSONContent = {
        content: [{ type: "image", attrs: null as any }], // Симуляція відсутності attrs
      };

      const result = tiptapDocToEntities(doc);

      const entity = result.content[0];
      expect(entity.content).toEqual({}); // default domainContent
      expect(entity.physicalRelativePath).toBe("");
      expect(entity.objectPath).toEqual([]);
      expect(entity.props).toEqual({});
    });
  });
});