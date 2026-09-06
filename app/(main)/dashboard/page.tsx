"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Footer } from "@/components/footer";
import {
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Search,
  BookOpen,
  AppWindow,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Globe,
  Menu,
  X,
  Eye,
  Clock,
  RotateCcw,
  Layers,
  Trash2,
} from "lucide-react";
import type { AppItem, ArticleItem, SubpageItem, PipelineTaskItem } from "@/lib/types";
import {
  DashboardSkeleton,
  DashboardOverviewSkeleton,
  ArticlesTabSkeleton,
  AppsTabSkeleton,
} from "@/components/dashboard-skeleton";
// Illustration header pastel gradient backgrounds
const PASTEL_GRADIENTS = [
  "from-pink-100 via-rose-50 to-amber-50 dark:from-pink-950/40 dark:via-rose-900/30 dark:to-amber-950/20",
  "from-purple-100 via-violet-50 to-pink-50 dark:from-purple-950/40 dark:via-violet-900/30 dark:to-pink-950/20",
  "from-blue-100 via-sky-50 to-indigo-50 dark:from-blue-950/40 dark:via-sky-900/30 dark:to-indigo-950/20",
  "from-amber-100 via-orange-50 to-rose-50 dark:from-amber-950/40 dark:via-orange-900/30 dark:to-rose-950/20",
  "from-emerald-100 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-900/30 dark:to-cyan-950/20",
  "from-rose-100 via-red-50 to-orange-50 dark:from-rose-950/40 dark:via-red-900/30 dark:to-orange-950/20",
];

type ActiveTab = "dashboard" | "articles" | "apps";
type Scope = "user" | "system" | "all";
type ViewMode = "grid" | "list";
type SortOption = "latest" | "popular" | "name";

interface PublicationsResponse {
  success: boolean;
  user?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  scope: string;
  apps: AppItem[];
  articles: ArticleItem[];
  subpages: SubpageItem[];
  counts: {
    apps: number;
    articles: number;
    subpages: number;
    total: number;
  };
}

function DashboardContent() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  const [activeNav, setActiveNav] = useState<ActiveTab>("dashboard");
  const [scope, setScope] = useState<Scope>("user");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Data fetching
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PublicationsResponse | null>(null);
  const [tasks, setTasks] = useState<PipelineTaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);

  const handleDeleteArticle = async (e: React.MouseEvent, articleId: string, articleTitle: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`确定要删除推荐文章《${articleTitle}》吗？此操作不可撤销。`)) {
      return;
    }

    try {
      setDeletingArticleId(articleId);
      const res = await fetch(`/api/articles/${articleId}`, { method: "DELETE" });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (json.success) {
        fetchPublications(scope);
      } else {
        alert(json.error || "删除失败");
      }
    } catch {
      alert("网络请求异常，删除失败");
    } finally {
      setDeletingArticleId(null);
    }
  };
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push(`/login?redirect=${encodeURIComponent("/dashboard")}`);
    }
  }, [sessionLoading, session, router]);

  // Load user publications
  const fetchPublications = async (targetScope: Scope) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/publications?scope=${targetScope}`);
      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent("/dashboard")}`);
        return;
      }
      const json = (await res.json()) as PublicationsResponse;
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load publications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchPublications(scope);
    }
  }, [session, scope]);

  // Fetch user ongoing pipeline tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/user/tasks");
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; tasks: PipelineTaskItem[] };
        if (json.success && Array.isArray(json.tasks)) {
          setTasks(json.tasks);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchTasks();
    }
  }, [session]);

  // Auto poll active tasks every 3.5s
  useEffect(() => {
    const hasActive = tasks.some((t) => t.status === "processing");
    if (!hasActive) return;

    const timer = setInterval(() => {
      fetchTasks();
      fetchPublications(scope);
    }, 3500);

    return () => clearInterval(timer);
  }, [tasks, scope]);

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status === "processing"),
    [tasks]
  );
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userEmail = session?.user?.email || "";
  const userAvatar = session?.user?.image;

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    if (!data) return [];
    let list = [...data.articles];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tag.toLowerCase().includes(q)
      );
    }
    if (sortBy === "latest") {
      list.sort((a, b) => b.created_at - a.created_at);
    } else if (sortBy === "name") {
      list.sort((a, b) => a.title.localeCompare(b.title, "zh"));
    } else if (sortBy === "popular") {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    return list;
  }, [data, searchQuery, sortBy]);

  // Filter and sort apps
  const filteredApps = useMemo(() => {
    if (!data) return [];
    let list = [...data.apps];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.tagline?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "latest") {
      list.sort((a, b) => b.created_at - a.created_at);
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, "zh"));
    } else if (sortBy === "popular") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return list;
  }, [data, searchQuery, sortBy]);

  // Total stats
  const totalArticleViews = useMemo(() => {
    if (!data?.articles) return 0;
    return data.articles.reduce((acc, cur) => acc + (cur.views || 0), 0);
  }, [data]);

  // Handle logout
  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  if (sessionLoading) {
    return <DashboardSkeleton />;
  }

  const navItems = [
    {
      key: "dashboard",
      label: "数据概览 (Dashboard)",
      icon: BarChart3,
      count: null,
      activeBadge: activeTasks.length > 0 ? `${activeTasks.length} 进行中` : null,
    },
    { key: "articles", label: "我的文章 (Articles)", icon: FileText, count: data?.counts?.articles || 0, activeBadge: null },
    { key: "apps", label: "推荐应用 (Apps)", icon: AppWindow, count: data?.counts?.apps || 0, activeBadge: null },
  ] as const;

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-background text-foreground flex flex-col antialiased selection:bg-rose-500 selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-card border-b border-border/80 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <Menu className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </button>
          <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
            {activeNav === "dashboard"
              ? "控制台概览"
              : activeNav === "articles"
              ? "我的文章"
              : "推荐应用"}
          </span>
        </div>

        <Link
          href="/recommend"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>推荐新应用</span>
        </Link>
      </div>

      {/* Main Workspace: Sidebar + Content Area */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1440px] mx-auto">
        {/* 
          ========================================================================
          LEFT SIDEBAR:
          - Cleaned up: only Dashboard, Articles, Apps, Settings, Back to Store, Logout
          - Unused menus removed: feed, events, tools, help center
          - Sticky on desktop
          ========================================================================
        */}
        <aside
          className={`
            fixed md:sticky top-0 left-0 z-40 h-screen w-64 min-w-[16rem] bg-white dark:bg-card border-r border-neutral-200/70 dark:border-neutral-800 flex flex-col justify-between p-5 select-none transition-transform duration-200
            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <div className="space-y-6">
            {/* Mobile close button */}
            <div className="flex md:hidden items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                控制中心
              </span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Header */}
            <div className="flex items-center gap-3 pt-2">
              <div className="relative">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-11 h-11 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-card" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">
                  <span className="truncate">HI {userName}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{userEmail || "创作者"}</p>
              </div>
            </div>

            {/* Navigation Menu: Only Dashboard, Articles, Apps */}
            <nav className="space-y-1.5 pt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.key as ActiveTab);
                      setMobileSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer
                      ${
                        isActive
                          ? "text-rose-500 dark:text-rose-400 font-semibold bg-rose-50/70 dark:bg-rose-950/30 shadow-2xs"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? "text-rose-500 dark:text-rose-400"
                            : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {/* Active indicator bar or count */}
                    <div className="flex items-center gap-1.5">
                      {item.activeBadge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse shadow-2xs">
                          {item.activeBadge}
                        </span>
                      )}
                      {item.count !== null && item.count > 0 && !item.activeBadge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? "bg-rose-500 text-white font-bold"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                      {isActive && (
                        <span className="w-1 h-5 rounded-full bg-rose-500 dark:bg-rose-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Controls */}
          <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800 space-y-1">
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition"
            >
              <Globe className="w-4 h-4 text-neutral-400" />
              <span>返回应用商店</span>
            </Link>

            <button
              type="button"
              onClick={() => alert("个人设置面板开发中")}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition cursor-pointer"
            >
              <Settings className="w-4 h-4 text-neutral-400" />
              <span>设置 (Settings)</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>退出登录 (Logout)</span>
            </button>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* 
          ========================================================================
          MAIN CONTENT AREA:
          - Separated views for Dashboard, Articles, and Apps
          ========================================================================
        */}
        <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 space-y-8">
          {/* Top Bar: Title & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                {activeNav === "dashboard"
                  ? "数据概览"
                  : activeNav === "articles"
                  ? "我的文章"
                  : "推荐应用"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {activeNav === "dashboard"
                  ? "查看您的文章创作与推荐应用统计数据"
                  : activeNav === "articles"
                  ? "您每次推荐提交生成的专属解读文章，归属您的个人账号所有"
                  : "应用域名为公共目录，支持任何人再次提交触发 AI 自动更新"}
              </p>
            </div>

            {/* Right Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {activeNav !== "dashboard" && (
                <>
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === "list"
                          ? "bg-white dark:bg-card text-rose-500 shadow-2xs border border-rose-200 dark:border-rose-900/60"
                          : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      }`}
                      title="列表视图"
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === "grid"
                          ? "bg-white dark:bg-card text-rose-500 shadow-2xs border border-rose-300 dark:border-rose-900/60"
                          : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      }`}
                      title="网格视图"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={activeNav === "articles" ? "搜索我的文章..." : "搜索推荐应用..."}
                      className="w-36 sm:w-48 pl-8 pr-3 py-1.5 rounded-full bg-white dark:bg-card border border-neutral-200 dark:border-neutral-800 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  {/* Sort by */}
                  <div className="relative inline-flex items-center">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-white dark:bg-card border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium rounded-full px-3.5 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                      <option value="latest">最新优先</option>
                      <option value="popular">热度优先</option>
                      <option value="name">名称排序</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 pointer-events-none" />
                  </div>
                </>
              )}

              {/* Action Button */}
              {activeNav === "articles" ? (
                <Link
                  href="/article/generate"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>打字机撰写文章</span>
                </Link>
              ) : (
                <Link
                  href="/recommend"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>推荐新应用</span>
                </Link>
              )}
            </div>
          </div>

          {/* Rule Clarification Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-neutral-700 dark:text-neutral-300">
                <strong>开放机制提示：</strong>应用域名为公共推荐目录，无所有权绑定，支持任何人再次提交触发 AI 自动更新；每次推荐生成的<strong>专属文章</strong>归属您的个人账号。
              </span>
            </div>
            <Link
              href="/recommend"
              className="text-rose-600 dark:text-rose-400 hover:underline font-semibold shrink-0"
            >
              去推荐新应用 &rarr;
            </Link>
          </div>

          {/* 
            ========================================================================
            TAB 1: DASHBOARD (Overview)
            ========================================================================
          */}
          {activeNav === "dashboard" && (
            loading ? (
              <DashboardOverviewSkeleton />
            ) : (
              <div className="space-y-8 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Stat 1: Articles */}
                <div
                  onClick={() => setActiveNav("articles")}
                  className="p-5 rounded-3xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-800/80 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">专属推荐文章</span>
                    <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center group-hover:scale-110 transition">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50">
                      {data?.counts.articles || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">篇专属文章</span>
                  </div>
                  <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-2 flex items-center gap-1 font-medium">
                    <span>管理全部文章</span>
                    <ArrowRight className="w-3 h-3" />
                  </p>
                </div>

                {/* Stat 2: Recommended Apps */}
                <div
                  onClick={() => setActiveNav("apps")}
                  className="p-5 rounded-3xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-violet-300 dark:hover:border-violet-800/80 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">参与推荐的应用</span>
                    <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-500 flex items-center justify-center group-hover:scale-110 transition">
                      <AppWindow className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50">
                      {data?.counts.apps || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">款应用</span>
                  </div>
                  <p className="text-[11px] text-violet-500 dark:text-violet-400 mt-2 flex items-center gap-1 font-medium">
                    <span>查看推荐应用库</span>
                    <ArrowRight className="w-3 h-3" />
                  </p>
                </div>

                {/* Stat 3: Total Views */}
                <div className="p-5 rounded-3xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">文章累计阅读量</span>
                    <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50">
                      {totalArticleViews}
                    </span>
                    <span className="text-xs text-muted-foreground">次总浏览</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    持续撰写推荐可获得更多读者认可
                  </p>
                </div>
              </div>

              {/* Ongoing Tasks Section: 实时显示进行中的任务与进度条 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {activeTasks.length > 0 ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                      </span>
                    ) : (
                      <Clock className="w-4 h-4 text-neutral-400" />
                    )}
                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span>进行中的分析与发布任务</span>
                      {activeTasks.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900/60">
                          {activeTasks.length} 项进行中
                        </span>
                      )}
                    </h2>
                  </div>

                  <Link
                    href="/recommend"
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新建推荐任务</span>
                  </Link>
                </div>

                {tasks.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-white dark:bg-card border border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">暂无后台执行的任务</p>
                        <p className="text-[11px] text-muted-foreground">提交新应用或重新更新已有域名后，此处将实时呈现进度与流水线阶段。</p>
                      </div>
                    </div>
                    <Link
                      href="/recommend"
                      className="text-xs px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground font-medium transition"
                    >
                      立即提交
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task) => {
                      const isProcessing = task.status === "processing";
                      const isFailed = task.status === "failed";
                      const isCompleted = task.status === "completed";
                      const isArticleTask =
                        task.id.startsWith("art_") ||
                        task.step_name.includes("打字机") ||
                        task.step_name.includes("文章");

                      return (
                        <div
                          key={task.id}
                          className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border transition-all ${
                            isProcessing
                              ? "border-rose-300 dark:border-rose-900/80 shadow-xs ring-1 ring-rose-500/10"
                              : "border-neutral-200/80 dark:border-neutral-800 shadow-2xs"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isProcessing
                                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500 border-rose-200 dark:border-rose-900/60"
                                    : isCompleted
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border-emerald-200 dark:border-emerald-900/60"
                                    : "bg-red-50 dark:bg-red-950/40 text-red-500 border-red-200 dark:border-red-900/60"
                                }`}
                              >
                                {isProcessing ? (
                                  <RotateCcw className="w-4 h-4 animate-spin" />
                                ) : isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                                    {task.url}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      isProcessing
                                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                                        : isCompleted
                                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                        : "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {isProcessing
                                      ? "处理中"
                                      : isCompleted
                                      ? "已完成"
                                      : "处理失败"}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>步骤 {task.step}/5: {task.step_name}</span>
                                  <span>•</span>
                                  <span className="font-mono text-[11px] font-bold text-foreground">{task.progress}%</span>
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isProcessing ? (
                                isArticleTask ? (
                                  <Link
                                    href={`/article/generate?taskId=${task.id}&url=${encodeURIComponent(task.url)}`}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>查看打字机印制进度</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                ) : (
                                  <Link
                                    href={`/recommend/${task.id}?url=${encodeURIComponent(task.url)}`}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 text-xs font-semibold shadow-xs transition active:scale-95"
                                  >
                                    <span>查看收录流水线</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                )
                              ) : isCompleted ? (
                                <div className="flex items-center gap-2">
                                  {task.article_id ? (
                                    <Link
                                      href={`/article/${task.article_id}`}
                                      className="px-3.5 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1"
                                    >
                                      <BookOpen className="w-3 h-3" />
                                      <span>阅读文章</span>
                                    </Link>
                                  ) : null}
                                  {task.app_id ? (
                                    <Link
                                      href={`/app/${task.app_id}`}
                                      className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground text-xs font-semibold transition"
                                    >
                                      查看应用
                                    </Link>
                                  ) : null}
                                </div>
                              ) : (
                                <Link
                                  href={
                                    isArticleTask
                                      ? `/article/generate?url=${encodeURIComponent(task.url)}`
                                      : `/recommend?url=${encodeURIComponent(task.url)}`
                                  }
                                  className="px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                >
                                  重试
                                </Link>
                              )}
                            </div>
                          </div>
                          {/* Animated Progress Bar */}
                          <div className="mt-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isProcessing
                                  ? "bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 animate-pulse"
                                  : isCompleted
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.max(5, Math.min(100, task.progress))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Section 1: Recent Articles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      最近发布的文章
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav("articles")}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
                  >
                    <span>查看全部 ({data?.counts.articles || 0})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {filteredArticles.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-card border border-dashed border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs text-muted-foreground">暂无发布的文章，推荐一个新应用即可自动生成专属解读文章！</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredArticles.slice(0, 3).map((art, idx) => (
                      <Link
                        key={art.id}
                        href={`/article/${art.id}`}
                        className="group p-4 rounded-2xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                              {art.tag}
                            </span>
                            <span className="text-[11px] text-neutral-400">{art.read_time}</span>
                          </div>
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-rose-600 transition-colors line-clamp-1">
                            {art.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {art.summary}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{art.views || 0} 阅读</span>
                          </span>
                          <span className="text-rose-500 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            阅读 &rarr;
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Recommended Apps */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AppWindow className="w-4 h-4 text-violet-500" />
                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      我推荐的应用
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav("apps")}
                    className="text-xs text-violet-500 hover:text-violet-600 font-semibold flex items-center gap-1"
                  >
                    <span>查看全部 ({data?.counts.apps || 0})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {filteredApps.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-white dark:bg-card border border-dashed border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs text-muted-foreground">您尚未参与推荐任何应用，快去推荐第一个心仪的应用吧！</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredApps.slice(0, 3).map((app, idx) => (
                      <Link
                        key={app.id}
                        href={`/app/${app.id}`}
                        className="group p-4 rounded-2xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-2xs hover:shadow-xs transition flex items-center gap-3.5"
                      >
                        <img
                          src={app.icon_url}
                          alt={app.name}
                          className="w-12 h-12 rounded-xl object-cover bg-neutral-100 border border-neutral-200 dark:border-neutral-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-rose-600 transition-colors truncate">
                              {app.name}
                            </h3>
                            <span className="text-[10px] text-amber-500 font-bold ml-1">★ {app.rating}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {app.tagline || app.description}
                          </p>
                          <span className="text-[10px] text-neutral-400 mt-1 inline-block">
                            {app.category} · {app.rating_count}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}

          {/* 
            ========================================================================
            TAB 2: ARTICLES (我的专属文章列表)
            ========================================================================
          */}
          {activeNav === "articles" && (
            <div className="space-y-6">
              {loading ? (
                <ArticlesTabSkeleton />
              ) : filteredArticles.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-card border border-dashed border-neutral-200 dark:border-neutral-800 space-y-4 my-6">
                  <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">暂无专属文章</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      输入任何想要推荐的应用网址，AI 自动提炼核心特色并为您生成专属推荐文章。
                    </p>
                  </div>
                  <Link
                    href="/recommend"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>去推荐应用并生成文章</span>
                  </Link>
                </div>
              ) : viewMode === "grid" ? (
                /* Grid View for Articles */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((art, idx) => {
                    const gradient = PASTEL_GRADIENTS[idx % PASTEL_GRADIENTS.length];
                    return (
                      <div
                        key={art.id}
                        className="bg-white dark:bg-card rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
                      >
                        {/* Top Banner */}
                        <div
                          className={`relative h-36 w-full bg-gradient-to-tr ${gradient} flex items-center justify-center overflow-hidden`}
                        >
                          {art.cover_image ? (
                            <img
                              src={art.cover_image}
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-12 h-12 text-rose-500/70" />
                            </div>
                          )}
                          <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-xs text-[10px] font-bold text-neutral-700 dark:text-neutral-300 shadow-2xs border border-white/50">
                            {art.tag}
                          </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                            {art.title}
                          </h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-3">
                            {art.read_time} · {art.views || 0} 次阅读
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                            {art.summary}
                          </p>

                          {/* Action Button */}
                          <div className="mt-auto pt-2 flex items-center gap-2">
                            <Link
                              href={`/article/${art.id}`}
                              className="flex-1 py-2.5 px-4 rounded-xl border border-rose-300 dark:border-rose-500/60 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 active:scale-98"
                            >
                              <span>阅读文章</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>

                            <Link
                              href={`/app/${art.app_id}`}
                              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                              title="查看关联应用"
                            >
                              <AppWindow className="w-4 h-4" />
                            </Link>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteArticle(e, art.id, art.title)}
                              disabled={deletingArticleId === art.id}
                              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer disabled:opacity-50"
                              title="删除文章"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View for Articles */
                <div className="space-y-3">
                  {filteredArticles.map((art) => (
                    <div
                      key={art.id}
                      className="p-4 rounded-2xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {art.cover_image ? (
                          <img
                            src={art.cover_image}
                            alt={art.title}
                            className="w-16 h-12 rounded-xl object-cover bg-neutral-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground truncate">
                              {art.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                              {art.tag}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{art.summary}</p>
                          <p className="text-[11px] text-neutral-400">
                            {art.read_time} · {art.views || 0} 阅读
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <Link
                          href={`/article/${art.id}`}
                          className="w-full sm:w-auto px-5 py-2 rounded-xl border border-rose-300 dark:border-rose-500/60 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition text-center flex items-center justify-center gap-1.5"
                        >
                          <span>阅读文章</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteArticle(e, art.id, art.title)}
                          disabled={deletingArticleId === art.id}
                          className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer disabled:opacity-50"
                          title="删除文章"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 
            ========================================================================
            TAB 3: APPS (推荐的应用列表)
            ========================================================================
          */}
          {activeNav === "apps" && (
            <div className="space-y-6">
              {/* Scope Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setScope("user")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      scope === "user"
                        ? "bg-rose-500 text-white shadow-2xs font-semibold"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span>我推荐的应用</span>
                    {data && (
                      <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                        {data.counts.apps}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope("system")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      scope === "system"
                        ? "bg-rose-500 text-white shadow-2xs font-semibold"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span>平台公共应用库 (System)</span>
                  </button>
                </div>

                <div className="text-[11px] text-muted-foreground px-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>当前展示 {filteredApps.length} 款应用</span>
                </div>
              </div>

              {loading ? (
                <AppsTabSkeleton />
              ) : filteredApps.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-card border border-dashed border-neutral-200 dark:border-neutral-800 space-y-4 my-6">
                  <div className="w-14 h-14 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-500 mx-auto flex items-center justify-center">
                    <AppWindow className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">
                      {scope === "user" ? "暂未推荐任何应用" : "暂无应用"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      输入任何 Web App 网址，即可收录该应用并自动生成您的专属推荐文章。
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <Link
                      href="/recommend"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>立即推荐新应用</span>
                    </Link>
                    {scope === "user" && (
                      <button
                        type="button"
                        onClick={() => setScope("system")}
                        className="px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                      >
                        浏览平台公共应用库
                      </button>
                    )}
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                /* Grid View for Apps */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredApps.map((app, idx) => {
                    const gradient = PASTEL_GRADIENTS[idx % PASTEL_GRADIENTS.length];
                    return (
                      <div
                        key={app.id}
                        className="bg-white dark:bg-card rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
                      >
                        {/* Banner */}
                        <div
                          className={`relative h-36 w-full bg-gradient-to-tr ${gradient} flex items-center justify-center overflow-hidden`}
                        >
                          {app.cover_url ? (
                            <img
                              src={app.cover_url}
                              alt={app.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <AppWindow className="w-12 h-12 text-violet-500/70" />
                            </div>
                          )}
                          <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-xs text-[10px] font-bold text-neutral-700 dark:text-neutral-300 shadow-2xs border border-white/50">
                            {app.category}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex flex-col flex-1 relative">
                          <div className="-mt-10 mb-2 flex justify-start">
                            <img
                              src={app.icon_url}
                              alt={app.name}
                              className="w-11 h-11 rounded-full object-cover bg-white dark:bg-card border-2 border-white dark:border-card shadow-sm"
                            />
                          </div>

                          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                            {app.name}
                          </h3>

                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-2">
                            {app.rating_count} 人评分 · 评级 {app.rating} ★
                          </p>

                          {app.description && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                              {app.description}
                            </p>
                          )}

                          {/* Action Buttons */}
                          <div className="mt-auto pt-2 space-y-2">
                            <Link
                              href={`/app/${app.id}`}
                              className="w-full py-2 px-4 rounded-xl border border-rose-300 dark:border-rose-500/60 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 active:scale-98 shadow-2xs"
                            >
                              <span>查看应用详情</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>

                            <Link
                              href={`/article/generate?appId=${app.id}`}
                              className="w-full py-1.5 px-3 rounded-lg text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition text-center flex items-center justify-center gap-1 font-semibold"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>使用打字机撰写专属推荐</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View for Apps */
                <div className="space-y-3">
                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl bg-white dark:bg-card border border-neutral-200/80 dark:border-neutral-800 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={app.icon_url}
                          alt={app.name}
                          className="w-12 h-12 rounded-xl object-cover bg-neutral-100 border border-neutral-200 dark:border-neutral-700 shrink-0"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground truncate">
                              {app.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                              {app.category}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{app.tagline || app.description}</p>
                          <p className="text-[11px] text-neutral-400">
                            评分 {app.rating} ★ · {app.rating_count}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <Link
                          href={`/app/${app.id}`}
                          className="w-full sm:w-auto px-5 py-2 rounded-xl border border-rose-300 dark:border-rose-500/60 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition text-center flex items-center justify-center gap-1.5"
                        >
                          <span>查看详情</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 
        ========================================================================
        FOOTER: Displayed at the bottom of the page when scrolling down!
        - Satisfies requirement: "滚动到底部 依旧可以显示 footer"
        ========================================================================
      */}
      <Footer />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
