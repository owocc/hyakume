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
  featured: boolean;
  trending: boolean;
  created_at: number;
  updated_at: number;
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
