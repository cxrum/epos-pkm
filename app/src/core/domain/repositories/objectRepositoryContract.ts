import type { EpObjectId, ObjectFilterOptions } from "@/core/types";
import type { BaseEpObjectEntity } from "../type";

export interface ObjectStorageRepositoryContract {
  get(id: EpObjectId): Promise<BaseEpObjectEntity | undefined>;
  create(data: BaseEpObjectEntity): Promise<BaseEpObjectEntity>;
  update(
    id: EpObjectId,
    newData: BaseEpObjectEntity,
  ): Promise<BaseEpObjectEntity>;
  delete(id: EpObjectId): Promise<boolean>;
  getAll(
    filterOptions: ObjectFilterOptions | undefined,
  ): Promise<BaseEpObjectEntity[]>;
  move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean>;
}
