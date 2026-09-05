import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import enMessages from "../messages/en.json";
import zhCnMessages from "../messages/zh-cn.json";

export const locales = ["en", "zh-cn"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const messagesMap: Record<Locale, typeof enMessages> = {
  en: enMessages,
  "zh-cn": zhCnMessages,
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value || cookieStore.get("locale")?.value;

  const locale: Locale =
    cookieLocale && (locales as readonly string[]).includes(cookieLocale)
      ? (cookieLocale as Locale)
      : defaultLocale;

  return {
    locale,
    messages: messagesMap[locale] ?? enMessages,
  };
});
