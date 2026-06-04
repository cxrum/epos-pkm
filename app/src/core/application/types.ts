import type { Icon, EpObjectId, EpTypeId, ObjectPath } from "../types"

export interface EpType {
    id: EpTypeId
    icon?: Icon
}

export interface EpObject{
    type: EpType,
    path: ObjectPath,
    content: Record<string, any>
}

export interface TreeNode {
    id: EpObjectId
    path: ObjectPath
    type?: EpType
    children: TreeNode[]
}