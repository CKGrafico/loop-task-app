import { createIntl, type IntlShape, type ResolvedIntlConfig } from "react-intl";
import enMessages from "./en.json";
import type { I18nMessage } from "../../../shared/ipc";

export const defaultLocale = "en";

/** react-intl needs flat "a.b.c" ids; the catalog files are nested for readability. */
function flattenMessages(nested: Record<string, unknown>, prefix = ""): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(nested)) {
    const id = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      flat[id] = value;
    } else if (value && typeof value === "object") {
      Object.assign(flat, flattenMessages(value as Record<string, unknown>, id));
    }
  }
  return flat;
}

export const messages: Record<string, Record<string, string>> = {
  en: flattenMessages(enMessages),
};

const intlConfig: ResolvedIntlConfig = {
  locale: defaultLocale,
  messages: messages[defaultLocale],
  defaultLocale,
};

const standaloneIntl: IntlShape = createIntl(intlConfig);

export function translateMessage(intl: IntlShape, message: I18nMessage | string | null | undefined): string {
  if (!message) return "";
  if (typeof message === "string") return message;
  return intl.formatMessage({ id: message.key }, message.params as Record<string, string | number> | undefined);
}

export { standaloneIntl };
