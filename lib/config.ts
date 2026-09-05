/**
 * Global Site Configuration for Hyakume
 * Centralized settings for brand name, metadata, and site-wide copy.
 */
export const SITE_CONFIG = {
  name: "Hyakume",
  title: "Hyakume - 现代化 Web App 精选收录平台",
  description: "发现与探索优秀的现代化 Web App，支持自动化推荐与投放收录。",
  tagline: "现代化 Web App 精选收录平台",
  subTagline: "现代化 Web App 精选收录平台。致力于发现优质在线工具，支持一键快照与自动化收录。",
  poweredBy: "Powered by WakaStudio®",
  copyright: "© 2026 Hyakume. All rights reserved.",
} as const;

export type SiteConfig = typeof SITE_CONFIG;
