export interface DeviceScreenshots {
  pc?: string;
  tablet?: string;
  mobile?: string;
}

export interface AppItem {
  id: string;
  name: string;
  tagline: string;
  url: string;
  category: string;
  categories: string[];
  developer: string;
  developer_id?: string;
  icon_url: string;
  cover_url: string;
  primary_color?: string;
  seo_image?: string;
  screenshots: string[];
  device_screenshots?: DeviceScreenshots;
  preview_features: string[];
  description: string;
  rating: number;
  rating_count: string;
  ranking?: string;
  age_rating: string;
  price: string;
  size: string;
  compatibility: string;
  languages: string;
  version: string;
  version_date: string;
  release_notes: string;
  privacy_linked: string[];
  privacy_not_linked: string[];
  events?: Array<{
    badge: string;
    tag: string;
    title: string;
    desc: string;
    image: string;
  }>;
  related_topics?: Array<{
    tag: string;
    title: string;
    desc: string;
    image: string;
    article_id?: string;
    github_url?: string;
    x_url?: string;
  }>;
  featured: boolean;
  trending: boolean;
  user_id?: string;
  created_at: number;
  updated_at: number;
  subpages?: SubpageItem[];
  articles?: ArticleItem[];
}

export interface ReviewItem {
  id: string;
  app_id: string;
  title: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  created_at: number;
}
export interface CategoryItem {
  id: string;
  name: string;
  icon?: string;
  sort_order?: number;
  created_at?: number;
}

export interface SubpageItem {
  id: string;
  app_id: string;
  url: string;
  path: string;
  title: string;
  description: string;
  screenshot: string;
  screenshots?: string[];
  label: string;
  is_meaningful: boolean;
  article_id?: string;
  user_id?: string;
  created_at: number;
};

export interface ArticleLinkItem {
  label: string;
  url: string;
  type?: "github" | "x" | "docs" | "discord" | "community" | "website" | "demo" | "other" | string;
  icon?: string;
}

export interface ArticleItem {
  id: string;
  app_id: string;
  slug?: string;
  title: string;
  summary: string;
  tag: string;
  content: string;
  cover_image: string;
  github_url?: string;
  x_url?: string;
  source_url?: string;
  links?: ArticleLinkItem[];
  author: string;
  read_time: string;
  views: number;
  likes: number;
  user_id?: string;
  created_at: number;
  updated_at: number;
  app?: AppItem;
}

export interface PipelineTaskItem {
  id: string;
  user_id: string;
  url: string;
  domain?: string;
  status: "processing" | "completed" | "failed";
  step: number;
  step_name: string;
  progress: number;
  app_id?: string;
  article_id?: string;
  error?: string;
  created_at: number;
  updated_at: number;
}

export interface AnalyzeResult {
  name: string;
  tagline: string;
  url: string;
  category: string;
  categories: string[];
  developer: string;
  icon_url: string;
  cover_url: string;
  seo_image?: string;
  primary_color?: string;
  screenshots: string[];
  device_screenshots?: DeviceScreenshots;
  preview_features: string[];
  description: string;
  rating: number;
  rating_count: string;
  ranking?: string;
  age_rating: string;
  price: string;
  size: string;
  compatibility: string;
  languages: string;
  version: string;
  version_date: string;
  release_notes: string;
  privacy_linked: string[];
  privacy_not_linked: string[];
  events?: Array<{
    badge: string;
    tag: string;
    title: string;
    desc: string;
    image: string;
  }>;
  related_topics?: Array<{
    tag: string;
    title: string;
    desc: string;
    image: string;
  }>;
}
