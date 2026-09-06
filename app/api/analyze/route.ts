import { crawlWebsite } from "@/lib/crawler";
import { summarizeWithAgent, analyzeAndGenerateArticle } from "@/lib/agent";
import {
  insertApp,
  getAppByDomain,
  getAppById,
  updateApp,
  insertSubpage,
  insertArticle,
  getArticlesByAppId,
  getSubpagesByAppId,
} from "@/lib/db";
import type { SubpageItem, ArticleItem } from "@/lib/types";
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const rawUrl = body.url?.trim();

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

    // Check if domain is already recorded
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
            title: analysis.title,
            summary: analysis.summary,
            tag: analysis.tag,
            content: analysis.content,
            cover_image: crawlResult.screenshots[0] || crawlResult.coverUrl || existingApp.cover_url,
            github_url: analysis.github_url || crawlResult.githubUrl,
            x_url: analysis.x_url || crawlResult.xUrl,
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
          const updatedTopics = [newTopic, ...existingTopics.filter((t) => t.title !== savedArticle?.title)];
          await updateApp(existingApp.id, { related_topics: updatedTopics });
        }

        // 3. Save subpage snapshot & label annotation into subpagesTable
        const subpageId = "sub_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const savedSubpage: SubpageItem = {
          id: subpageId,
          app_id: existingApp.id,
          url: target,
          path: pathname + (parsed.search || ""),
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

        return Response.json({
          success: true,
          alreadyExists: true,
          isSubpage: true,
          skippedMainScreenshot: true,
          app: refreshedApp || existingApp,
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
      const [existingArticles, existingSubpages] = await Promise.all([
        getArticlesByAppId(existingApp.id),
        getSubpagesByAppId(existingApp.id),
      ]);

      let primaryArticle = existingArticles[0] || null;

      // If app has no article yet, auto generate one
      if (!primaryArticle) {
        try {
          const crawlResult = await crawlWebsite(target);
          const analysis = await analyzeAndGenerateArticle(crawlResult, existingApp);
          if (analysis.is_meaningful) {
            const artId = "art_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            primaryArticle = {
              id: artId,
              app_id: existingApp.id,
              slug: `${existingApp.id}-${Date.now().toString(36)}`,
              title: analysis.title,
              summary: analysis.summary,
              tag: analysis.tag,
              content: analysis.content,
              cover_image: existingApp.cover_url,
              github_url: analysis.github_url || crawlResult.githubUrl,
              x_url: analysis.x_url || crawlResult.xUrl,
              source_url: target,
              author: analysis.author,
              read_time: "3 分钟阅读",
              views: 0,
              likes: 0,
              created_at: Date.now(),
              updated_at: Date.now(),
            };
            await insertArticle(primaryArticle);
            const newTopic = {
              tag: primaryArticle.tag,
              title: primaryArticle.title,
              desc: primaryArticle.summary,
              image: primaryArticle.cover_image,
              article_id: primaryArticle.id,
              github_url: primaryArticle.github_url,
              x_url: primaryArticle.x_url,
            };
            await updateApp(existingApp.id, { related_topics: [newTopic] });
          }
        } catch (err) {
          console.warn("Auto article generation on existing app fallback:", err);
        }
      }

      const refreshedApp = await getAppById(existingApp.id);

      return Response.json({
        success: true,
        alreadyExists: true,
        isSubpage: false,
        app: refreshedApp || existingApp,
        article: primaryArticle,
        subpages: existingSubpages,
        crawl: {
          url: existingApp.url,
          title: existingApp.name,
          usedSeoImage: Boolean(existingApp.seo_image),
          coverUrl: existingApp.cover_url,
        },
        steps: [
          { step: 1, name: "匹配已有主站快照与记录", status: "completed" },
          { step: 2, name: "同步应用多端元数据与子页面", status: "completed" },
          { step: 3, name: "加载云端封面与快照存储", status: "completed" },
          { step: 4, name: "AI Agent 推荐解读与知识库关联", status: "completed" },
          { step: 5, name: "应用数据就绪", status: "completed" },
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

    // 2. Cover image report
    steps[2].status = "completed";

    // 3. AI Agent summary and initial article generation
    const appData = await summarizeWithAgent(crawlResult);
    steps[3].status = "completed";

    // 4. Save to database
    const savedApp = await insertApp(appData);

    let createdArticle: ArticleItem | null = null;
    if (appData.articles && appData.articles.length > 0) {
      try {
        const firstArticle = appData.articles[0];
        firstArticle.app_id = savedApp.id;
        createdArticle = await insertArticle(firstArticle);
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
          created_at: Date.now(),
        };
        await insertSubpage(createdSubpage);
      } catch (subErr) {
        console.warn("Failed to persist initial subpage:", subErr);
      }
    }

    steps[4].status = "completed";
    const refreshedApp = (await getAppById(savedApp.id)) || savedApp;

    return Response.json({
      success: true,
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
