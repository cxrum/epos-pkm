import { createI18n } from "vue-i18n";
import en from './locales/en.json'
import ua from './locales/ua.json'

export type MessageSchema = typeof en

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  globalInjection: true,
  messages: { en, ua },
})