import { getRequestConfig } from 'next-intl/server'
import en from '../messages/en'
import { defaultLocale, isLocale, type Locale } from './routing'

const messagesByLocale: Record<Locale, typeof en> = { en }

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = requested && isLocale(requested) ? requested : defaultLocale

  return {
    locale,
    messages: messagesByLocale[locale],
  }
})
