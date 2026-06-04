import type { EpObjectEntity } from "../type";

export interface ObjectStorageRepositoryContract {
    get(id: number): Promise<EpObjectEntity | null>;
    save(data: EpObjectEntity): Promise<EpObjectEntity>;
    getAll(): Promise<EpObjectEntity[]>;
}