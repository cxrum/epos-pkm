import type { PageData } from "@/core/domain/type";
import type { EpObjectType } from "@/core/types";

export type PageId = number

export interface Tree {
    id: PageId
    type?: EpObjectType
    childs: Tree[]
}
export type PagePath = PageId[]

export interface PagesServiceContract {
    get(id: PageId): PageData
    getAll(): PageData[]
    getTree(): Tree
    getPaths(): Record<PageId, PagePath>
    getPagePath(id: PageId): PagePath
}
