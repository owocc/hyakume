import { auth } from "@/lib/auth";
import { crawlWebsite, type CrawlResult, normalizeUrl } from "@/lib/crawler";
import { analyzeAndGenerateArticle, summarizeWithAgent, detectTargetKind } from "@/lib/agent";
import {
  getAppById,
  findAppForUrl,
  insertApp,
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

    // 1. If explicit appId provided, lookup app directly
    if (body.appId) {
      app = await getAppById(body.appId);
      if (app && !targetUrl) {
        targetUrl = app.url;
      }
    }

    if (!targetUrl) {
      return Response.json(
        { success: false, error: "请提供有效的应用 ID 或网址 (URL)" },
        { status: 400 }
      );
    }

    targetUrl = normalizeUrl(targetUrl);

    // 2. If app not found yet, search specifically for this target URL (not generic domain)
    if (!app) {
      app = await findAppForUrl(targetUrl);
    }

    const taskId =
      body.taskId ||
      "art_task_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const targetKind = detectTargetKind(targetUrl);
    const domainOrRepo =
      targetKind.kind === "github_project" && targetKind.githubRepo
        ? `${targetKind.githubRepo.owner}/${targetKind.githubRepo.repo}`
        : targetKind.kind === "github_profile" && targetKind.githubUsername
        ? `github.com/${targetKind.githubUsername}`
        : new URL(targetUrl).hostname;

    // Track generation task
    try {
      await createTask({
        id: taskId,
        user_id: userId,
        url: targetUrl,
        domain: domainOrRepo,
        status: "processing",
        step: 1,
        step_name: "正在深入抓取目标页面元数据与多端内容",
        progress: 15,
        app_id: app?.id,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    } catch {}

    // 3. Crawl target website specifically with timeout protection
    let crawlResult: CrawlResult;
    try {
      const crawlPromise = crawlWebsite(targetUrl, { isSubpage: false });
      const { promise: timeoutPromise, reject } = Promise.withResolvers<never>();
      const timer = setTimeout(() => reject(new Error("Crawl timeout")), 12000);
      try {
        crawlResult = await Promise.race([crawlPromise, timeoutPromise]);
      } finally {
        clearTimeout(timer);
      }
    } catch {
      let fallbackTitle = targetUrl;
      let fallbackDesc = "";
      if (targetKind.kind === "github_project" && targetKind.githubRepo) {
        fallbackTitle = `${targetKind.githubRepo.repo} (${targetKind.githubRepo.owner})`;
        fallbackDesc = `GitHub 开源项目：${targetKind.githubRepo.owner}/${targetKind.githubRepo.repo}`;
      } else if (targetKind.kind === "github_profile" && targetKind.githubUsername) {
        fallbackTitle = `${targetKind.githubUsername} 的 GitHub 个人主页`;
        fallbackDesc = `GitHub 开发者主页：@${targetKind.githubUsername}`;
      } else if (app) {
        fallbackTitle = app.name;
        fallbackDesc = app.description || app.tagline || "";
      }

      crawlResult = {
        url: targetUrl,
        title: fallbackTitle,
        description: fallbackDesc,
        coverUrl: app?.cover_url || "",
        seoImage: app?.seo_image,
        screenshots: app?.screenshots || [],
        deviceScreenshots: app?.device_screenshots,
        iconUrl: app?.icon_url || "",
        text: `${fallbackTitle} ${fallbackDesc}`,
        primaryColor: app?.primary_color,
        usedSeoImage: Boolean(app?.seo_image),
      };
    }

    // 4. Automatic application binding & generation check ("自动绑定应用和检测是否需要触发应用生成")
    if (!app) {
      try {
        await updateTask(taskId, {
          step: 2,
          step_name: "检测到未收录独立应用，自动构建应用档案与快照",
          progress: 35,
        });
      } catch {}

      const generatedAppData = await summarizeWithAgent(crawlResult);
      generatedAppData.user_id = userId;
      generatedAppData.url = targetUrl;

      app = await insertApp(generatedAppData);

      try {
        await updateTask(taskId, {
          app_id: app.id,
        });
      } catch {}
    }

    try {
      await updateTask(taskId, {
        step: 3,
        step_name: "打字机正在校准排版与智能构思专属文章",
        progress: 60,
      });
    } catch {}

    // 5. Run AI Analysis & Article Generation specifically for targetUrl
    const analysis = await analyzeAndGenerateArticle(crawlResult, app);

    try {
      await updateTask(taskId, {
        step: 4,
        step_name: "校验官方资源与印制文稿",
        progress: 85,
      });
    } catch {}

    // 6. Persist article to DB bound to the app
    const appId = app.id;
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
        app.cover_url ||
        "",
      github_url:
        analysis.github_url ||
        (targetKind.kind === "github_project" && targetKind.githubRepo
          ? `https://github.com/${targetKind.githubRepo.owner}/${targetKind.githubRepo.repo}`
          : undefined),
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
