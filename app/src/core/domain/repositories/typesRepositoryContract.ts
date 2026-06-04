import type { EpTypeId, SystemTypeId } from "@/core/types";
import type { EpTypeEntity, UserTypeEntity} from "../type";

export interface TypingRepositoryContract {
    get(id: EpTypeId): Promise<EpTypeEntity>;
    create(type: Omit<UserTypeEntity, 'kind'>): Promise<UserTypeEntity>;
    update(id: Exclude<EpTypeId, SystemTypeId>, newData: UserTypeEntity): Promise<UserTypeEntity>;
    remove(id: Exclude<EpTypeId, SystemTypeId>): Promise<boolean>;
}