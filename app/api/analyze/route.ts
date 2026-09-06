import { crawlWebsite } from "@/lib/crawler";
import { summarizeWithAgent, analyzeAndGenerateArticle, isValidGithubRepoUrl, isValidXUrl } from "@/lib/agent";
import {
  insertApp,
  getAppByDomain,
  getAppById,
  updateApp,
  insertSubpage,
  insertArticle,
  getArticlesByAppId,
  getSubpagesByAppId,
  createTask,
  updateTask,
} from "@/lib/db";
import type { SubpageItem, ArticleItem } from "@/lib/types";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  let currentTaskId: string | undefined;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return Response.json(
        { success: false, error: "必须为注册用户，登录后才能发布新的应用" },
        { status: 401 }
      );
    }
    const userId = session.user.id;
    const body = (await request.json()) as { url?: string; taskId?: string };
    const rawUrl = body.url?.trim();
    const taskId =
      body.taskId ||
      "rec_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    currentTaskId = taskId;
    if (!rawUrl) {
      return Response.json(
        { success: false, error: "请提供有效的网址 (URL)" },
        { status: 400 }
      );
    }

    // Normalize and parse target URL
    let target = rawUrl;
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `https://${target}`;
    }
    const parsed = new URL(target);
    const pathname = parsed.pathname;
    const isSubpage = Boolean(pathname && pathname !== "/" && pathname.length > 1);

    // Record or update task progress in DB
    await createTask({
      id: taskId,
      user_id: userId,
      url: target,
      domain: parsed.hostname,
      status: "processing",
      step: 1,
      step_name: "页面渲染与多端快照截取",
      progress: 20,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    const existingApp = await getAppByDomain(target);
    if (existingApp) {
      // Case A: Domain already recorded in DB, and user provided a subpage (/xxx)
      if (isSubpage) {
        // 1. Crawl & screenshot the subpage ONLY (do NOT re-screenshot main website)
        const crawlResult = await crawlWebsite(target, { isSubpage: true });

        // 2. AI Agent assesses relevance and generates structured recommendation article
        const analysis = await analyzeAndGenerateArticle(crawlResult, existingApp);

        let savedArticle: ArticleItem | null = null;
        let articleId: string | undefined;

        if (analysis.is_meaningful) {
          articleId = "art_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          savedArticle = {
            id: articleId,
            app_id: existingApp.id,
            slug: `${existingApp.id}-${Date.now().toString(36)}`,
            user_id: userId,
            title: analysis.title,
            summary: analysis.summary,
            tag: analysis.tag,
            content: analysis.content,
            cover_image: crawlResult.screenshots[0] || crawlResult.coverUrl || existingApp.cover_url,
            github_url: isValidGithubRepoUrl(analysis.github_url) ? analysis.github_url : undefined,
            x_url: isValidXUrl(analysis.x_url) ? analysis.x_url : undefined,
            source_url: target,
            author: analysis.author,
            read_time: "3 分钟阅读",
            views: 0,
            likes: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
          };
          await insertArticle(savedArticle);

          // Update parent app related_topics so this article is prominently featured at the bottom
          const newTopic = {
            tag: savedArticle.tag,
            title: savedArticle.title,
            desc: savedArticle.summary,
            image: savedArticle.cover_image,
            article_id: savedArticle.id,
            github_url: savedArticle.github_url,
            x_url: savedArticle.x_url,
          };
          const existingTopics = Array.isArray(existingApp.related_topics) ? existingApp.related_topics : [];
          const updatedTopics = [newTopic, ...existingTopics.filter((t: { title?: string }) => t.title !== savedArticle?.title)];
          await updateApp(existingApp.id, { related_topics: updatedTopics });
        }

        // 3. Save subpage snapshot & label annotation into subpagesTable
        const subpageId = "sub_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const savedSubpage: SubpageItem = {
          id: subpageId,
          app_id: existingApp.id,
          url: target,
          path: pathname + (parsed.search || ""),
          user_id: userId,
          title: crawlResult.title || pathname,
          description: crawlResult.description || "",
          screenshot: crawlResult.screenshots[0] || crawlResult.coverUrl,
          screenshots: crawlResult.screenshots,
          label: analysis.label,
          is_meaningful: analysis.is_meaningful,
          article_id: articleId,
          created_at: Date.now(),
        };
        await insertSubpage(savedSubpage);

        // Refresh app with newly associated subpages and articles
        const refreshedApp = await getAppById(existingApp.id);

        await updateTask(taskId, {
          status: "completed",
          step: 5,
          step_name: "子页面快照与文章生成完成",
          progress: 100,
          app_id: existingApp.id,
          article_id: savedArticle?.id,
        });

        return Response.json({
          success: true,
          taskId,
          alreadyExists: true,
          subpage: savedSubpage,
          article: savedArticle,
          crawl: {
            url: target,
            title: crawlResult.title,
            usedSeoImage: crawlResult.usedSeoImage,
            coverUrl: crawlResult.coverUrl,
            screenshots: crawlResult.screenshots,
            deviceScreenshots: crawlResult.deviceScreenshots,
          },
          steps: [
            { step: 1, name: `主站记录已存在 (${existingApp.name})，跳过主站截图`, status: "completed" },
            { step: 2, name: `对子页面 (${pathname}) 执行快照截取与元数据抽取`, status: "completed" },
            { step: 3, name: `子页面多端快照存储与【${analysis.label}】标注`, status: "completed" },
            {
              step: 4,
              name: analysis.is_meaningful
                ? `AI Agent 深度研判：提炼推荐文章《${analysis.title}》`
                : "AI Agent 完成页面属性评估",
              status: "completed",
            },
            { step: 5, name: "结构化写入数据库并更新应用页面库", status: "completed" },
          ],
        });
      }

      // Case B: Main site URL submitted and already in DB
      // Domain is public/shared; trigger an AI content update and generate a new recommendation article for THIS user
      const crawlResult = await crawlWebsite(target, { isSubpage: false });
      const appData = await summarizeWithAgent(crawlResult);

      // Update public app details with latest AI analysis
      await updateApp(existingApp.id, {
        tagline: appData.tagline || existingApp.tagline,
        description: appData.description || existingApp.description,
        category: appData.category || existingApp.category,
        screenshots: appData.screenshots && appData.screenshots.length > 0 ? appData.screenshots : existingApp.screenshots,
        preview_features: appData.preview_features && appData.preview_features.length > 0 ? appData.preview_features : existingApp.preview_features,
        updated_at: Date.now(),
      });

      // Generate and attribute a fresh recommendation article to the submitting user
      const articleId = "art_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const userArticle: ArticleItem = {
        id: articleId,
        app_id: existingApp.id,
        slug: `${existingApp.id}-${Date.now().toString(36)}`,
        user_id: userId,
        title: appData.articles?.[0]?.title || `深度解析与精选推荐：${existingApp.name}`,
        summary: appData.articles?.[0]?.summary || appData.description,
        tag: appData.category || "精选推荐",
        content: appData.articles?.[0]?.content || appData.description,
        cover_image: crawlResult.screenshots[0] || crawlResult.coverUrl || existingApp.cover_url,
        github_url: isValidGithubRepoUrl(appData.articles?.[0]?.github_url)
          ? appData.articles![0].github_url
          : (isValidGithubRepoUrl(crawlResult.githubUrl) ? crawlResult.githubUrl : undefined),
        x_url: isValidXUrl(appData.articles?.[0]?.x_url)
          ? appData.articles![0].x_url
          : (isValidXUrl(crawlResult.xUrl) ? crawlResult.xUrl : undefined),
        source_url: target,
        author: session.user.name || "精选推荐官",
        read_time: "3 分钟阅读",
        views: 0,
        likes: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      await insertArticle(userArticle);

      await updateTask(taskId, {
        status: "completed",
        step: 5,
        step_name: "应用信息更新与专属文章归属完成",
        progress: 100,
        app_id: existingApp.id,
        article_id: userArticle.id,
      });

      const [refreshedApp, existingSubpages] = await Promise.all([
        getAppById(existingApp.id),
        getSubpagesByAppId(existingApp.id),
      ]);

      return Response.json({
        success: true,
        taskId,
        alreadyExists: true,
        isSubpage: false,
        app: refreshedApp || existingApp,
        article: userArticle,
        subpages: existingSubpages,
        crawl: {
          url: existingApp.url,
          title: existingApp.name,
          usedSeoImage: Boolean(existingApp.seo_image),
          coverUrl: existingApp.cover_url,
          screenshots: crawlResult.screenshots,
        },
        steps: [
          { step: 1, name: "匹配已有公共域名记录，触发 AI 重新深度抓取", status: "completed" },
          { step: 2, name: "多端渲染并自动更新应用信息", status: "completed" },
          { step: 3, name: "AI 总结更新应用功能特色，公共数据已刷新", status: "completed" },
          { step: 4, name: `为您生成专属归属推荐文章《${userArticle.title}》`, status: "completed" },
          { step: 5, name: "内容更新与文章归属完成", status: "completed" },
        ],
      });
    }

    const steps = [
      { step: 1, name: "页面渲染与多端快照截取 (PC / 平板 / 手机)", status: "processing" },
      { step: 2, name: "提取网页元数据与文本", status: "pending" },
      { step: 3, name: "多端截图与封面图存储至 Storage (R2)", status: "pending" },
      { step: 4, name: "AI Agent 总结应用功能与特色", status: "pending" },
      { step: 5, name: "结构化写入数据库", status: "pending" },
    ];

    // 1. Crawl website & capture screenshot/metadata
    const crawlResult = await crawlWebsite(target, { isSubpage });
    steps[0].status = "completed";
    steps[1].status = "completed";

    await updateTask(taskId, {
      step: 3,
      step_name: "多端截图存储与文本提取完成",
      progress: 55,
    });

    // 2. Cover image report
    steps[2].status = "completed";

    // 3. AI Agent summary and initial article generation
    const appData = await summarizeWithAgent(crawlResult);
    steps[3].status = "completed";

    await updateTask(taskId, {
      step: 4,
      step_name: "AI Agent 深度解析与文章生成",
      progress: 80,
    });
    // 4. Save to database
    appData.user_id = userId;
    const savedApp = await insertApp({
      ...appData,
      user_id: userId,
    });
    let createdArticle: ArticleItem | null = null;
    if (appData.articles && appData.articles.length > 0) {
      try {
        const firstArticle = appData.articles[0];
        firstArticle.app_id = savedApp.id;
        firstArticle.user_id = userId;
        createdArticle = await insertArticle({
          ...firstArticle,
          github_url: isValidGithubRepoUrl(firstArticle.github_url) ? firstArticle.github_url : undefined,
          x_url: isValidXUrl(firstArticle.x_url) ? firstArticle.x_url : undefined,
          user_id: userId,
        });
      } catch (artSaveErr) {
        console.warn("Failed to persist initial article:", artSaveErr);
      }
    }
    // If submitted URL was a subpage, also save to subpagesTable
    let createdSubpage: SubpageItem | null = null;
    if (isSubpage) {
      try {
        const subpageId = "sub_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        createdSubpage = {
          id: subpageId,
          app_id: savedApp.id,
          url: target,
          path: pathname + (parsed.search || ""),
          title: crawlResult.title || pathname,
          description: crawlResult.description || "",
          screenshot: crawlResult.screenshots[0] || crawlResult.coverUrl,
          screenshots: crawlResult.screenshots,
          label: "核心页面",
          is_meaningful: true,
          article_id: createdArticle?.id,
          user_id: userId,
          created_at: Date.now(),
        };
        await insertSubpage(createdSubpage);
      } catch (subErr) {
        console.warn("Failed to persist initial subpage:", subErr);
      }
    }

    steps[4].status = "completed";
    const refreshedApp = (await getAppById(savedApp.id)) || savedApp;

    await updateTask(taskId, {
      status: "completed",
      step: 5,
      step_name: "推荐收录与文章归属完成",
      progress: 100,
      app_id: savedApp.id,
      article_id: createdArticle?.id,
    });

    return Response.json({
      success: true,
      taskId,
      app: refreshedApp,
      subpage: createdSubpage,
      article: createdArticle,
      isSubpage,
      crawl: {
        url: crawlResult.url,
        title: crawlResult.title,
        usedSeoImage: crawlResult.usedSeoImage,
        coverUrl: crawlResult.coverUrl,
        screenshots: crawlResult.screenshots,
        deviceScreenshots: crawlResult.deviceScreenshots,
      },
      steps,
    });
  } catch (err) {
    console.error("Analysis pipeline error:", err);
    try {
      if (currentTaskId) {
        await updateTask(currentTaskId, {
          status: "failed",
          step_name: "分析处理异常",
          error: err instanceof Error ? err.message : "分析失败",
          progress: 100,
        });
      }
    } catch {}
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "分析网页失败，请重试",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url")?.trim();
  if (!rawUrl) {
    return Response.json({ success: false, error: "请提供有效的网址 (URL)" }, { status: 400 });
  }

  const app = await getAppByDomain(rawUrl);
  return Response.json({
    success: true,
    exists: Boolean(app),
    app,
  });
}
