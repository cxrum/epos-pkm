import type { EpType, TypeId } from "../type";

export interface TypingRepositoryContract {
    get(id: TypeId): EpType
    update(id: TypeId, newData: EpType)
}