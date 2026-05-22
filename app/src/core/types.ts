export interface LoadedPage{
    id: number,
    type?: string,
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