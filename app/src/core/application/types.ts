import type { BaseEpObjectEntity, EpTypeEntity } from "../domain/type";
import type { Icon, EpObjectId, EpTypeId, ObjectPath } from "../types";

export const toEpType = (entity: EpTypeEntity): EpType => {
  return {
    id: entity.id,
    title: entity.title,
    icon: entity.icon,
  };
};

export const toEpTypeArray = (entities: EpTypeEntity[]): EpType[] => {
  return entities.map(toEpType);
};

export const toEpObject = (entity: BaseEpObjectEntity): EpObject => {
  return {
    id: entity.id,
    type: entity.typeId,
    path: entity.path,
    content: entity.content,
  };
};

export const toEpObjectArray = (entities: BaseEpObjectEntity[]): EpObject[] => {
  return entities.map(toEpObject);
};

export interface EpType {
  id: EpTypeId;
  title: string;
  icon?: Icon;
}

export interface EpObject {
  id: EpObjectId;
  type: EpTypeId;
  path: ObjectPath;
  content: Record<string, any>;
}

export interface ObjectHierarchyNode {
  id: EpObjectId;
  path: ObjectPath;
  type?: EpType;
  children: ObjectHierarchyNode[];
}
