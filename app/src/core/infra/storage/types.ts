import type { Icon } from "@/core/types";
export interface EpTypeDTO {
  id: number
  icon?: Icon
}

export interface EpObjectDTO {
  id: number
  type: EpTypeDTO
}

export interface PathDTO{
  id: number,
  title: string,
}

export interface PageDataDTO{
  object: EpObjectDTO,
  title: string,
  content: Record<string, any>
}
