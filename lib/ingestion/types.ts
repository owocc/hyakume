import type { AppItem } from "../types";
import type { CrawlResult } from "../crawler";

export interface ReviewFields {
  name: string;
  tagline: string;
  description: string;
  categories: string[];
  preview_features: string[];
  developer: string;
  icon_url: string;
  cover_url: string;
}

export interface IngestionDraft {
  id: string;
  url: string;
  source: "url" | "manual";
  kind: "app" | "subpage";
  fields: ReviewFields;
  crawl: Omit<CrawlResult, "screenshotBuffer">;
  warnings: string[];
  app: AppItem;
  createdAt: number;
}

export interface ReviewResponse {
  success: boolean;
  requiresConfirmation?: boolean;
  draft?: IngestionDraft;
  publishedAppId?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}
