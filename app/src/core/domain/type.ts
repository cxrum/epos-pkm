import type { Icon } from "../types";

export type TypeId = number
export type ObjectId = number

export interface EpType {
    id: TypeId
    icon?: Icon
}

export interface EpObject {
    id: ObjectId
    type: EpType
}

export interface Path{
    id: number,
    title: string,
}

export interface PageData{
    object: EpObject,
    path: Array<Path>,
    title: string,
    content: Record<string, any>
}
