import type { EpObjectEntity } from "@/core/domain/type";
import type { EpObjectId, Icon } from "@/core/types";
import type { CommandType } from "./extension/commandLine/commandLineControllerContract";

export const mapEpTypeToTiptapType = (typeId: string): string => {
  if (typeId === "def:text") return "paragraph";
  if (typeId === "def:heading") return "heading";
  if (typeId === "def:code") return "codeBlock";
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
  typeId: string;
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
];
