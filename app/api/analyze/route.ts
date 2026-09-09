import { auth } from "@/lib/auth";
import { getAppByDomain } from "@/lib/db";
import { prepareDraft } from "@/lib/ingestion/pipeline";
import { loadDraft } from "@/lib/ingestion/repository";
import { errorResponse, readJson } from "@/lib/ingestion/http";
import { IngestionError, validDraftId } from "@/lib/ingestion/validation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new IngestionError("登录后才能解析和发布应用", 401);
    const body = await readJson(request);
    const result = await prepareDraft({ userId: session.user.id, url: body.url, taskId: body.taskId });
    return Response.json({ success: true, requiresConfirmation: !result.publishedAppId, ...result });
  } catch (error) { return errorResponse(error); }
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    if (params.has("draftId")) {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) throw new IngestionError("请先登录", 401);
      const result = await loadDraft(validDraftId(params.get("draftId")), session.user.id);
      if (!result) throw new IngestionError("草稿不存在或无权访问", 404);
      return Response.json({ success: true, requiresConfirmation: !result.publishedAppId, ...result });
    }
    const url = params.get("url")?.trim();
    if (!url) throw new IngestionError("请提供有效的网址 (URL)");
    const app = await getAppByDomain(url);
    return Response.json({ success: true, exists: Boolean(app), app });
  } catch (error) { return errorResponse(error); }
}
