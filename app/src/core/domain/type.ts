import type { EpObjectType } from "@/core/types";

export interface Path{
    id: number,
    title: string,
}

export interface PageData{
    id: number,
    type: EpObjectType,
    path: Array<Path>,
    title: string,
    content: Record<string, any>
}
