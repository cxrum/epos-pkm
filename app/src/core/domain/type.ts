import type { Icon, EpObjectId, EpTypeId, ObjectPath, SystemTypeId } from "../types";

interface TypeHierarchyNode {
    
    children: TypeHierarchyNode[]
}

interface BaseTypeEntity {
    icon?: Icon;
    title: string;
}

export interface SystemTypeEntity extends BaseTypeEntity {
    id: SystemTypeId; 
    kind: 'system';
}

export interface UserTypeEntity extends BaseTypeEntity {
    id: EpTypeId; 
    kind: 'user';
}

export type EpTypeEntity = SystemTypeEntity | UserTypeEntity;


export interface EpObjectEntity {
    id: EpObjectId
    type: EpTypeEntity
    path: ObjectPath
    content: Record<string, any>
}