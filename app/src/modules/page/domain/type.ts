import type { EpObjectType } from "@/core/types";

export interface Path{
    title: string,
}

export interface PageData{
    id: number,
    type: EpObjectType,
    path: Array<Path>,
    title: string,
    content: Record<string, any>
}
