import { auth } from "@/lib/auth";
import { crawlWebsite, type CrawlResult } from "@/lib/crawler";
import { analyzeAndGenerateArticle } from "@/lib/agent";
import {
  getAppById,
  getAppByDomain,
  insertArticle,
  updateTask,
  createTask,
} from "@/lib/db";
import type { ArticleItem, AppItem } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return Response.json(
        { success: false, error: "必须为注册用户，登录后才能生成推荐文章" },
        { status: 401 }
      );
    }
    const userId = session.user.id;
    const body = (await request.json()) as {
      appId?: string;
      url?: string;
      tag?: string;
      taskId?: string;
    };

    let app: AppItem | null = null;
    let targetUrl = body.url?.trim() || "";

    if (body.appId) {
      app = await getAppById(body.appId);
      if (app) targetUrl = app.url;
    }

    if (!app && targetUrl) {
      app = await getAppByDomain(targetUrl);
    }

    if (!targetUrl && app) {
      targetUrl = app.url;
    }

    if (!targetUrl) {
      return Response.json(
        { success: false, error: "请提供有效的应用 ID 或网址 (URL)" },
        { status: 400 }
      );
    }

    const taskId =
      body.taskId ||
      "art_task_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // Track generation task
    try {
      await createTask({
        id: taskId,
        user_id: userId,
        url: targetUrl,
        domain: app?.id || new URL(targetUrl).hostname,
        status: "processing",
        step: 2,
        step_name: "打字机正在校准排版与智能构思",
        progress: 30,
        app_id: app?.id,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    } catch {}

    // 1. Crawl website with timeout protection, falling back to cached app data
    let crawlResult: CrawlResult;
    try {
      const crawlPromise = crawlWebsite(targetUrl, { isSubpage: false });
      const { promise: timeoutPromise, reject } = Promise.withResolvers<never>();
      const timer = setTimeout(() => reject(new Error("Crawl timeout")), 8000);
      try {
        crawlResult = await Promise.race([crawlPromise, timeoutPromise]);
      } finally {
        clearTimeout(timer);
      }
    } catch {
      crawlResult = {
        url: targetUrl,
        title: app?.name || targetUrl,
        description: app?.description || app?.tagline || "",
        coverUrl: app?.cover_url || "",
        seoImage: app?.seo_image,
        screenshots: app?.screenshots || [],
        deviceScreenshots: app?.device_screenshots,
        iconUrl: app?.icon_url || "",
        text: `${app?.name || ""} ${app?.tagline || ""} ${app?.description || ""}`,
        primaryColor: app?.primary_color,
        usedSeoImage: Boolean(app?.seo_image),
      };
    }
    try {
      await updateTask(taskId, {
        step: 3,
        step_name: "打字机正在打字排版核心章节",
        progress: 60,
      });
    } catch {}

    // 2. Run AI Analysis with specialized adapters (GitHub Profile, Project, Web App)
    const analysis = await analyzeAndGenerateArticle(crawlResult, app || undefined);

    try {
      await updateTask(taskId, {
        step: 4,
        step_name: "校验官方资源与印制文稿",
        progress: 85,
      });
    } catch {}

    // 3. Persist article to DB attributed to this user
    const appId = app?.id || new URL(targetUrl).hostname;
    const articleId =
      "art_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const savedArticle: ArticleItem = {
      id: articleId,
      app_id: appId,
      slug: `${appId}-${Date.now().toString(36)}`,
      user_id: userId,
      title: analysis.title,
      summary: analysis.summary,
      tag: body.tag || analysis.tag || "精选推荐",
      content: analysis.content,
      cover_image:
        crawlResult.screenshots[0] ||
        crawlResult.coverUrl ||
        app?.cover_url ||
        "",
      github_url: analysis.github_url,
      x_url: analysis.x_url,
      links: analysis.links,
      source_url: targetUrl,
      author: session.user.name || "AppStore 精选编辑部",
      read_time: "3 分钟阅读",
      views: 0,
      likes: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await insertArticle(savedArticle);

    try {
      await updateTask(taskId, {
        status: "completed",
        step: 5,
        step_name: "打字机文稿已正式印制并归属您的账号",
        progress: 100,
        app_id: appId,
        article_id: articleId,
      });
    } catch {}

    return Response.json({
      success: true,
      taskId,
      article: savedArticle,
      app,
    });
  } catch (err) {
    console.error("Failed to generate article:", err);
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "文章生成失败，请重试",
      },
      { status: 500 }
    );
  }
}
