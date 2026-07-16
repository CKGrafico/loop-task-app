import { loader } from 'fumadocs-core/source'
import type { I18nConfig } from 'fumadocs-core/i18n'
import { docs } from '../.source/server'
import { defaultLocale, locales } from '../i18n/routing'

export const docsI18n: I18nConfig = {
  defaultLanguage: defaultLocale,
  languages: [...locales],
}

export const source = loader({
  baseUrl: '/docs',
  i18n: docsI18n,
  source: docs.toFumadocsSource(),
})
