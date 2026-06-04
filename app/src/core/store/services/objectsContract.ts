import type { EpObject, EpType, ObjectPath, TreeNode } from "@/core/application/types";
import type { EpObjectId } from "@/core/types";

export interface ObjetServiceContract {
    get(id: EpObjectId): EpObject
    getAll(): EpObject[]
    getAllByType(type: EpType): EpObject[]
    getTree(): TreeNode
    getPaths(): Record<EpObjectId, ObjectPath>
    getObjectPath(id: EpObjectId): ObjectPath


}
