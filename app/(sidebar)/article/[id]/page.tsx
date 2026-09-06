import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleById, getAppById, getAllArticles } from "@/lib/db";
import { ArticleContentRenderer } from "@/components/article-content-renderer";
import {
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Calendar,
  Clock,
  Code2,
  Share2,
  Layers,
  ChevronRight,
  BookOpen,
  Globe,
  MessageSquare,
} from "lucide-react";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) return { title: "文章不存在" };

  return {
    title: `${article.title} - Web App Store`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: article.cover_image ? [article.cover_image] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  const app = await getAppById(article.app_id);
  const otherArticles = (await getAllArticles(6)).filter((a) => a.id !== article.id);

  const formattedDate = new Date(article.created_at).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="border-b border-border bg-card/40 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <Link
              href="/apps"
              className="hover:text-foreground transition flex items-center gap-1 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>应用商店</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-border shrink-0" />
            {app && (
              <>
                <Link
                  href={`/app/${app.id}`}
                  className="hover:text-foreground transition truncate max-w-[120px] sm:max-w-[200px]"
                >
                  {app.name}
                </Link>
                <ChevronRight className="w-3 h-3 text-border shrink-0" />
              </>
            )}
            <span className="text-foreground font-medium truncate">推荐解读</span>
          </div>

          {app && (
            <Link
              href={`/app/${app.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>查看应用详情</span>
            </Link>
          )}
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10">
        {/* Header Hero */}
        <header className="space-y-4 sm:space-y-5 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide uppercase shadow-2xs">
              <Sparkles className="w-3 h-3" />
              <span>{article.tag || "精选推荐"}</span>
            </span>

            {article.links && article.links.length > 0 ? (
              article.links.map((link, idx) => {
                const isGh = link.type === "github" || link.url.includes("github.com");
                const isX = link.type === "x" || link.url.includes("x.com") || link.url.includes("twitter.com");
                const isDocs = link.type === "docs" || link.label.includes("文档");
                const isDiscord = link.type === "discord" || link.url.includes("discord");

                return (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition shadow-2xs ${
                      isGh
                        ? "bg-neutral-900 text-white hover:bg-neutral-800"
                        : isX
                        ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 hover:bg-sky-500/25"
                        : isDocs
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25"
                        : isDiscord
                        ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/25"
                        : "bg-secondary text-foreground hover:bg-secondary-hover border border-border"
                    }`}
                  >
                    {isGh ? (
                      <Code2 className="w-3 h-3" />
                    ) : isX ? (
                      <Share2 className="w-3 h-3" />
                    ) : isDocs ? (
                      <BookOpen className="w-3 h-3" />
                    ) : isDiscord ? (
                      <MessageSquare className="w-3 h-3" />
                    ) : (
                      <ExternalLink className="w-3 h-3" />
                    )}
                    <span>{link.label}</span>
                  </a>
                );
              })
            ) : (
              <>
                {article.github_url && /^https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/.test(article.github_url) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-900 text-white text-[11px] font-medium">
                    <Code2 className="w-3 h-3" />
                    <span>包含 GitHub 仓库</span>
                  </span>
                )}

                {article.x_url && /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/.test(article.x_url) && !article.x_url.replace(/\/+$/, "").endsWith("/x.com") && !article.x_url.replace(/\/+$/, "").endsWith("/twitter.com") && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[11px] font-medium border border-sky-500/25">
                    <Share2 className="w-3 h-3" />
                    <span>包含 X 社区动态</span>
                  </span>
                )}
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-[1.2]">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="font-medium text-foreground">
              {article.author || "AppStore 精选编辑部"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.read_time || "3 分钟阅读"}
            </span>
          </div>

          {/* Lead Summary Callout */}
          {article.summary && (
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 text-foreground/90 text-sm sm:text-base leading-relaxed shadow-xs">
              <p className="font-medium">{article.summary}</p>
            </div>
          )}
        </header>

        {/* Parent App Quick Card */}
        {app && (
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card border border-border shadow-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={app.icon_url}
                alt={app.name}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-2xs shrink-0"
              />
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground truncate">
                    {app.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-[11px] font-medium text-muted-foreground shrink-0">
                    {app.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-md">
                  {app.tagline || app.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition shadow-2xs"
              >
                <span>访问应用</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <Link
                href={`/app/${app.id}`}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-secondary hover:bg-muted text-foreground text-xs font-semibold transition"
              >
                <span>在商店查看</span>
              </Link>
            </div>
          </div>
        )}
        {/* AI-collected Official Resources & Links Card */}
        {article.links && article.links.length > 0 && (
          <div className="p-5 rounded-2xl sm:rounded-3xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>关联资源与官方链接</span>
              </span>
              <span className="text-[11px] text-muted-foreground">AI 智能提取已校验</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-secondary/60 hover:bg-secondary border border-border transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                      {link.type === "github" || link.url.includes("github.com") ? (
                        <Code2 className="w-4 h-4" />
                      ) : link.type === "x" || link.url.includes("x.com") || link.url.includes("twitter.com") ? (
                        <Share2 className="w-4 h-4 text-sky-500" />
                      ) : link.type === "docs" || link.label.includes("文档") ? (
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                      ) : link.type === "discord" || link.url.includes("discord") ? (
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{link.label}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-xs">{link.url}</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* GitHub Repository Highlight Box */}
        {article.github_url && /^https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/.test(article.github_url) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 text-neutral-100 border border-neutral-800 shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                  GitHub Open Source Repository
                </span>
                <span className="text-sm font-bold text-white font-mono break-all">
                  {article.github_url.replace(/^https?:\/\/github\.com\//, "")}
                </span>
              </div>
            </div>

            <a
              href={article.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-neutral-900 text-xs font-bold hover:bg-neutral-200 transition shadow-xs shrink-0"
            >
              <span>前往 GitHub 仓库</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* X / Twitter Highlight Box */}
        {article.x_url && /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/.test(article.x_url) && !article.x_url.replace(/\/+$/, "").endsWith("/x.com") && !article.x_url.replace(/\/+$/, "").endsWith("/twitter.com") && (
          <div className="p-4 sm:p-5 rounded-2xl bg-sky-950/20 dark:bg-sky-950/40 border border-sky-500/20 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                  X (Twitter) 社区讨论与动态
                </span>
                <span className="text-xs text-muted-foreground break-all">
                  {article.x_url}
                </span>
              </div>
            </div>

            <a
              href={article.x_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 transition shadow-xs shrink-0"
            >
              <span>查看 X 动态</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Cover Screenshot Image */}
        {article.cover_image && (
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-border shadow-xs bg-card">
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full h-auto max-h-[440px] object-cover object-top"
            />
            {article.source_url && (
              <div className="p-3 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground px-4">
                <span className="truncate max-w-md">收纳来源页面：{article.source_url}</span>
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground inline-flex items-center gap-1 font-medium shrink-0 ml-2"
                >
                  <span>访问该页</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Article Body Rendered */}
        <div className="pt-2">
          <ArticleContentRenderer
            content={article.content}
            githubUrl={article.github_url}
            xUrl={article.x_url}
          />
        </div>

        {/* Footer actions */}
        <div className="pt-8 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {app && (
              <Link
                href={`/recommend?url=${encodeURIComponent(app.url)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border hover:bg-surface text-xs font-semibold text-foreground transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>为该应用收纳更多页面</span>
              </Link>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Copyright © {new Date().getFullYear()} Web App Store 精选编辑部
          </div>
        </div>

        {/* Other Recommendations */}
        {otherArticles.length > 0 && (
          <section className="space-y-4 pt-10 border-t border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                更多精选推荐文章
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherArticles.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/article/${item.id}`}
                  className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-all shadow-xs group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                      {item.tag}
                    </span>
                    <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium pt-2 border-t border-border flex items-center justify-between">
                    <span>{item.author}</span>
                    <span className="text-primary group-hover:translate-x-0.5 transition-transform">
                      阅读全文 →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
