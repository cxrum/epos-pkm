import type { Icon } from "@/core/types";

export interface AutoCompleteItem {
  id: string;
  icon: Icon;
  label: string;
  text: string;
  description?: string;
}
