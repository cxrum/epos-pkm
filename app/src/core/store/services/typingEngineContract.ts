import type { EpType } from "@/core/application/types";
import type { EpTypeId } from "@/core/types";

export interface TypingServiceContract {
   getTypes(): EpType[]
   create(type: EpType): void
   checkComparability(parentType: EpTypeId, childType: EpTypeId): boolean
   
   inherit(parentType: EpTypeId, childType: EpTypeId): void
   rmChild(parentType: EpTypeId, childType: EpTypeId): void
}
