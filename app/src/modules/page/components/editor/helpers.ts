import type { EpObjectEntity } from "@/core/domain/type";
import type { EpObjectId } from "@/core/types";

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
