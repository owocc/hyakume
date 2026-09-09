import { auth } from "@/lib/auth";
import { crawlWebsite, normalizeUrl } from "@/lib/crawler";
import { analyzeAndGenerateArticle } from "@/lib/agent";
import { getAppById, findAppForUrl, insertArticle, updateTask, createTask, getTaskById } from "@/lib/db";
import { errorResponse, readJson } from "@/lib/ingestion/http";
import { IngestionError, validDraftId } from "@/lib/ingestion/validation";
import type { ArticleItem } from "@/lib/types";

export async function POST(request: Request) {
  let currentTaskId: string | undefined;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new IngestionError("登录后才能生成推荐文章", 401);
    const userId = session.user.id;
    const body = await readJson(request);
    let app = typeof body.appId === "string" ? await getAppById(body.appId) : null;
    const rawUrl = typeof body.url === "string" ? body.url : app?.url;
    if (!rawUrl) throw new IngestionError("请提供有效的应用 ID 或网址 (URL)");
    let targetUrl: string;
    try { targetUrl = normalizeUrl(rawUrl); } catch { throw new IngestionError("请提供公开的 HTTP(S) 网址"); }
    if (!app) app = await findAppForUrl(targetUrl);
    if (!app) throw new IngestionError("请先收录应用并在表单中确认，再生成文章", 422);

    const taskId = body.taskId === undefined ? `art_task_${crypto.randomUUID()}` : validDraftId(body.taskId);
    const prior = await getTaskById(taskId);
    if (prior && (prior.user_id !== userId || prior.url !== targetUrl)) throw new IngestionError("任务不存在或无权访问", 404);
    await createTask({ id: taskId, user_id: userId, url: targetUrl, domain: new URL(targetUrl).hostname,
      status: "processing", step: 1, step_name: "提取原始 SEO 和网页正文", progress: 15,
      app_id: app.id, created_at: Date.now(), updated_at: Date.now() });
    currentTaskId = taskId;
    const crawl = await crawlWebsite(targetUrl);
    await updateTask(taskId, { step: 3, step_name: "基于已抓取内容生成文章", progress: 60 });
    const analysis = await analyzeAndGenerateArticle(crawl, app);
    if (!analysis.is_meaningful) throw new IngestionError("页面内容不足，未生成或发布文章", 422);
    const articleId = `art_${crypto.randomUUID()}`;
    const article: ArticleItem = {
      id: articleId, app_id: app.id, slug: articleId, user_id: userId,
      title: analysis.title, summary: analysis.summary,
      tag: typeof body.tag === "string" && body.tag.length <= 30 ? body.tag : analysis.tag,
      content: analysis.content, cover_image: crawl.screenshots[0] || crawl.coverUrl || app.cover_url,
      github_url: analysis.github_url, x_url: analysis.x_url, links: analysis.links, source_url: targetUrl,
      author: session.user.name || "编辑", read_time: `${Math.max(1, Math.ceil(analysis.content.length / 400))} 分钟阅读`,
      views: 0, likes: 0, created_at: Date.now(), updated_at: Date.now(),
    };
    await insertArticle(article);
    await updateTask(taskId, { status: "completed", step: 5, step_name: "文章已发布", progress: 100, app_id: app.id, article_id: articleId });
    return Response.json({ success: true, taskId, article, app });
  } catch (error) {
    if (currentTaskId) await updateTask(currentTaskId, { status: "failed", step_name: "文章未发布", error: "抓取或内容校验失败", progress: 0 }).catch(() => {});
    return errorResponse(error);
  }
}
