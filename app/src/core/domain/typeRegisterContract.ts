import type { RawEptTypeHierarchyNode } from "../infra/storage/type";
import type { EpTypeId } from "../types";
import type { EpTypeEntity } from "./type";

export interface TypeRegisterContract {
  register(schema: EpTypeEntity): void;
  registerEdge(parrentId: EpTypeId, childId: EpTypeId): void;
  get(id: string): EpTypeEntity | undefined;
  getJSONRepresentation(): RawEptTypeHierarchyNode[];
  systemRoot(): RawEptTypeHierarchyNode;
}
