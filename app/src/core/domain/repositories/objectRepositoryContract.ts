import type { EpObjectId, ObjectFilterOptions } from "@/core/types";
import type { EpObjectEntity } from "../type";

export interface ObjectStorageRepositoryContract {
  get(id: EpObjectId): Promise<EpObjectEntity | undefined>;
  create(data: EpObjectEntity): Promise<EpObjectEntity>;
  update(id: EpObjectId, newData: EpObjectEntity): Promise<EpObjectEntity>;
  delete(id: EpObjectId): Promise<boolean>;
  getAll(
    filterOptions: ObjectFilterOptions | undefined,
  ): Promise<EpObjectEntity[]>;
  move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean>;
}
