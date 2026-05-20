import type { Component } from 'vue'

export type MenuItemType = 'button' | 'divider'

export interface MenuItem {
  type: MenuItemType
  label?: string
  icon?: Component | string | null
  action?: () => void
  disabled?: boolean
}

export interface MenuGroup {
  title?: string
  items: MenuItem[]
}