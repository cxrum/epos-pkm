import type { Icon } from "@/shared/components/icon/type";

export interface EpObjectType {
  id: string;
  name: string;
  icon?: Icon;
}

export interface EpObject {
  id: number
  type: EpObjectType
  content: Record<string, any>
}

export interface LoadedPage{
    id: number,
    type?: EpObjectType,
    title: string,
}


export type SettingType = 'text' | 'boolean' | 'select' | 'number';


export interface SettingOption {
  label: string;
  value: string | number;
}

export interface SettingEntry {
  id: string;
  pluginId: string; 
  label: string;
  description?: string;
  type: SettingType;
  value: any;
  options?: SettingOption[]; 
}

export interface SettingsCategory {
  id: string;
  pluginId: string; 
  label: string;
  settingEntries: SettingEntry[]; 
}