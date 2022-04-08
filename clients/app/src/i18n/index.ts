import { createI18n } from 'vue-i18n'
import { globalTranslations } from './global'

export default createI18n({
  locale: navigator.language || 'nb_NO',
  globalInjection: true,
  fallbackLocale: {
    'nb-NO': ['nb_NO'],
    nb: ['nb_NO'],
    'nn-NO': ['nn_NO'],
    nn: ['nn_NO'],
    'en-AU': ['en'],
  },
  legacy: false,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  messages: globalTranslations,
})
