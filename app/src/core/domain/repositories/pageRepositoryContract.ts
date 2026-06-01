import type { PageData } from "../type";

export interface PageStorageRepositoryContract {
    save(data: PageData): Promise<PageData>;
    get(id: number): Promise<PageData | null>;
    getAll(): Promise<PageData[]>;
}