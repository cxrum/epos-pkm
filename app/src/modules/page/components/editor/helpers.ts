import type { EpObjectEntity } from "@/core/domain/type";
import type { EpObjectId, EpTypeId } from "@/core/types";

export const TEXT_BLOCK_TYPES = ["def:latex"];

export const mapEpTypeToTiptapType = (typeId: string): string => {
  if (typeId === "def:text") return "paragraph";
  if (typeId === "def:heading") return "heading";
  if (typeId === "def:code") return "codeBlock";

  if (TEXT_BLOCK_TYPES.includes(typeId)) return "epTextBlock";

  return "epBlock";
};

export const mapObjectEntitiesToContent = (
  data: EpObjectEntity[],
): Record<EpObjectId, EpObjectEntity> => {
  const res: Record<EpObjectId, EpObjectEntity> = {};
  data.forEach((it) => {
    res[it.id] = it;
  });
  return res;
};

export type BlockConfig = {
  baseId: string;
  typeId: EpTypeId;
  titlePrefix: string;
  variants: Record<string, any>[];
};

export const SYSTEM_BLOCK_CONFIG: BlockConfig[] = [
  {
    baseId: "heading",
    typeId: "def:heading",
    titlePrefix: "Heading",
    variants: [
      { level: { value: 1 } },
      { level: { value: 2 } },
      { level: { value: 3 } },
      { level: { value: 4 } },
      { level: { value: 5 } },
    ],
  },
  {
    baseId: "text",
    typeId: "def:text",
    titlePrefix: "Text",
    variants: [{}],
  },
  {
    baseId: "code",
    typeId: "def:code",
    titlePrefix: "Code Block",
    variants: [{}],
  },
  {
    baseId: "latex",
    typeId: "def:latex",
    titlePrefix: "LaTeX Block",
    variants: [{}],
  },
];
