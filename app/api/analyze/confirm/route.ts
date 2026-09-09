import { auth } from "@/lib/auth";
import { loadDraft, publishDraft } from "@/lib/ingestion/repository";
import { errorResponse, readJson } from "@/lib/ingestion/http";
import { IngestionError, requireConfirmation, validDraftId, validateReviewFields } from "@/lib/ingestion/validation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new IngestionError("登录后才能确认发布", 401);
    const body = await readJson(request, 128 * 1024);
    requireConfirmation(body.confirmed);
    const saved = await loadDraft(validDraftId(body.draftId), session.user.id);
    if (!saved) throw new IngestionError("草稿不存在或无权访问", 404);
    const appId = saved.publishedAppId || await publishDraft(saved.draft, validateReviewFields(body.fields), session.user.id);
    return Response.json({ success: true, appId, app: { id: appId } });
  } catch (error) { return errorResponse(error); }
}
