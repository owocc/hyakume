import { crawlWebsite } from "@/lib/crawler";
import { summarizeWithAgent } from "@/lib/agent";
import {
  insertApp,
  getAppByDomain,
  getAppById,
  updateApp,
  insertSubpage,
  getSubpagesByAppId,
  createTask,
  updateTask,
} from "@/lib/db";
import type { SubpageItem } from "@/lib/types";
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

    // Check if domain is already recorded
    const existingApp = await getAppByDomain(target);
    if (existingApp) {
      // Case A: Domain already recorded in DB, and user provided a subpage (/xxx)
      if (isSubpage) {
        // 1. Crawl & screenshot the subpage ONLY
        const crawlResult = await crawlWebsite(target, { isSubpage: true });

        // 2. Save subpage snapshot & label annotation into subpagesTable
        const subpageId = "sub_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const label = pathname.includes("doc")
          ? "技术文档"
          : pathname.includes("price")
          ? "定价方案"
          : "核心页面";

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
          label,
          is_meaningful: true,
          created_at: Date.now(),
        };
        await insertSubpage(savedSubpage);

        // Refresh app with newly associated subpages
        const refreshedApp = await getAppById(existingApp.id);

        await updateTask(taskId, {
          status: "completed",
          step: 5,
          step_name: "子页面快照已持久化入库",
          progress: 100,
          app_id: existingApp.id,
        });

        return Response.json({
          success: true,
          taskId,
          alreadyExists: true,
          isSubpage: true,
          skippedMainScreenshot: true,
          app: refreshedApp || existingApp,
          subpage: savedSubpage,
          article: null,
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
            { step: 3, name: `子页面多端快照存储与【${label}】标注`, status: "completed" },
            { step: 4, name: "页面属性评估完成 (文章推荐为独立流程)", status: "completed" },
            { step: 5, name: "结构化写入数据库并更新应用页面库", status: "completed" },
          ],
        });
      }

      // Case B: Main site URL submitted and already in DB
      // Domain is public/shared; update app metadata and screenshots
      const crawlResult = await crawlWebsite(target, { isSubpage: false });
      const appData = await summarizeWithAgent(crawlResult);

      // Update public app details with latest AI analysis
      await updateApp(existingApp.id, {
        tagline: appData.tagline || existingApp.tagline,
        description: appData.description || existingApp.description,
        category: appData.category || existingApp.category,
        screenshots:
          appData.screenshots && appData.screenshots.length > 0
            ? appData.screenshots
            : existingApp.screenshots,
        preview_features:
          appData.preview_features && appData.preview_features.length > 0
            ? appData.preview_features
            : existingApp.preview_features,
        updated_at: Date.now(),
      });

      await updateTask(taskId, {
        status: "completed",
        step: 5,
        step_name: "应用信息与多端快照已更新",
        progress: 100,
        app_id: existingApp.id,
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
        article: null,
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
          { step: 3, name: "AI 总结更新应用功能特色与多端分类", status: "completed" },
          { step: 4, name: "应用数据结构化更新就绪 (文章推荐为独立流程)", status: "completed" },
          { step: 5, name: "应用更新完成", status: "completed" },
        ],
      });
    }

    // Case C: Brand new app
    const steps = [
      { step: 1, name: "页面渲染与多端快照截取 (PC / 平板 / 手机)", status: "processing" },
      { step: 2, name: "提取网页元数据与文本", status: "pending" },
      { step: 3, name: "多端截图与封面图存储至 Storage (R2)", status: "pending" },
      { step: 4, name: "AI Agent 提炼应用功能与特色分类", status: "pending" },
      { step: 5, name: "结构化写入数据库与应用发布", status: "pending" },
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

    // 3. AI Agent summary for App Store metadata
    const appData = await summarizeWithAgent(crawlResult);
    steps[3].status = "completed";

    await updateTask(taskId, {
      step: 4,
      step_name: "AI Agent 提炼应用功能与特色分类",
      progress: 80,
    });

    // 4. Save to database (recommending app only, no forced article)
    appData.user_id = userId;
    const savedApp = await insertApp({
      ...appData,
      user_id: userId,
    });

    // If submitted URL was a subpage, also save to subpagesTable
    let createdSubpage: SubpageItem | null = null;
    if (isSubpage) {
      try {
        const subpageId =
          "sub_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        createdSubpage = {
          id: subpageId,
          app_id: savedApp.id,
          url: target,
          path: pathname + (parsed.search || ""),
          title: crawlResult.title || pathname,
          description: crawlResult.description || "",
          screenshot: crawlResult.screenshots[0] || crawlResult.coverUrl,
          screenshots: crawlResult.screenshots,
          label: pathname.includes("doc") ? "技术文档" : "核心页面",
          is_meaningful: true,
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
      step_name: "应用收录发布完成",
      progress: 100,
      app_id: savedApp.id,
    });

    return Response.json({
      success: true,
      taskId,
      app: refreshedApp,
      subpage: createdSubpage,
      article: null,
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
