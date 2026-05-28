import type { Icon } from "@/shared/components/icon/type";

export interface EpObjectTypeDTO {
    id: string;
    name: string;
    icon?: Icon;
}

export interface PageDTO {
  id: number;
  title: string;
  content: Record<string, any>;
  type: EpObjectTypeDTO;
  updatedAt?: number;
}