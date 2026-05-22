import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SettingsCategory, SettingEntry } from '../types'

export const useGlobalSettingsStore = defineStore('global-settings', () => {

  const loadedSettingsSchema = ref<SettingsCategory[]>([
    {
        id: 'core.category.general',
        pluginId: 'core',
        label: 'General Settings',
        settingEntries: [
            {
                id: 'core.autoSave',
                pluginId: 'core',
                label: 'Auto Save',
                description: 'Automatically save pages every 30 seconds',
                type: 'boolean',
                value: true
            }
        ]
    },
    {
        id: 'core.category.appearance',
        pluginId: 'core',
        label: 'Appearance',
        settingEntries: [
            {
                id: 'core.theme',
                pluginId: 'core',
                label: 'App Theme',
                type: 'select',
                value: 'dark',
                options: [
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' }
                ]
            },
            {
                id: 'core.theme2',
                pluginId: 'core',
                label: 'App Theme 2',
                type: 'select',
                value: 'dark',
                options: [
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' }
                ]
            }
        ]
    },
    {
        id: 'core.category.user',
        pluginId: 'core',
        label: 'User',
        settingEntries: [
            {
                id: 'core.username',
                pluginId: 'core',
                label: 'Username',
                type: 'text',
                value: 'dark'
            }
        ]
    }
  ])

  const updateSetting = (category_id: string, id: string, newValue: any) => {
    const category = loadedSettingsSchema.value.find(s => s.id === category_id)
    const setting = category?.settingEntries.find(e => e.id === id)

    if (setting) setting.value = newValue
  }

  const categories = computed(() => {
        return loadedSettingsSchema.value.map(category => ({
        id: category.id,
        label: category.label,
        }))
    }) 

  const settingsByCategory = (categoryId: string): SettingEntry[] => {
    const category = loadedSettingsSchema.value.find(c => c.id === categoryId)
    return category?.settingEntries || []
  }
  return {categories, settingsByCategory, updateSetting }

});