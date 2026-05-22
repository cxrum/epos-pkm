export interface Path{
    title: string,
}

export interface PageData{
    id: number,
    type?: string,
    path: Array<Path>,
    title: string,
    content: Object
}

export interface PageStorageRepository {
    save(data: PageData): Promise<PageData>;
    get(id: number): Promise<PageData | null>;
    getAll(): Promise<PageData[]>;
}