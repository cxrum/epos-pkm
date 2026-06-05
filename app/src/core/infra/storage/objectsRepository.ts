import type { ObjectStorageRepositoryContract } from "@/core/domain/repositories/objectRepositoryContract";
import type { EpObjectEntity } from "@/core/domain/type";
import type { EpObjectId, ObjectFilterOptions } from "@/core/types";

export class ObjectStorageRepository implements ObjectStorageRepositoryContract {
  private flattenStorageEmulator: EpObjectEntity[] = [];

  //   private descendantCache: Record<EpObjectId, EpObjectId[]>;
  //   private fileTreeStructure: TypeHierarchyNode;
  //   private typeTreeEdges: Edge<EpTypeId>[];

  async get(id: EpObjectId): Promise<EpObjectEntity | undefined> {
    return this.flattenStorageEmulator.find((val) => val.id === id);
  }
  async create(data: EpObjectEntity): Promise<EpObjectEntity> {
    const parentId =
      data.path[
        data.path.length === 0 ? data.path.length : data.path.length - 1
      ].id;
    if (!parentId) {
      throw Error();
    }
    const parent = await this.get(parentId);
    if (!parent) {
      throw Error();
    }

    // // TODO: Move hierarchy logic to domain level companion object, call this fun on application level
    // if (parent.typeId === "sys:root") {
    //   if (data.typeId !== "sys:page") {
    //     throw Error();
    //   }
    // }

    // if (parent.typeId === 'sys:page') {

    // }

    return data;
  }
  update(id: EpObjectId, newData: EpObjectEntity): Promise<EpObjectEntity> {
    throw new Error("Method not implemented.");
  }
  delete(id: EpObjectId): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  getAll(
    filterOptions: ObjectFilterOptions | undefined,
  ): Promise<EpObjectEntity[]> {
    throw new Error("Method not implemented.");
  }
  move(movedId: EpObjectId, parentId: EpObjectId): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
