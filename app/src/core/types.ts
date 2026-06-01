import type { DefaultIcon, EmojiIcon, LinkIcon } from "@/shared/components/icon/type";

export type Icon = DefaultIcon | LinkIcon | EmojiIcon;

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

export interface PageMetha{
    id: number,
    title: string,
    type?: EpObjectType,
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