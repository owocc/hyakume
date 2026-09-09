import { auth } from "@/lib/auth";
import { prepareDraft } from "@/lib/ingestion/pipeline";
import { readManualRequest } from "@/lib/ingestion/manual";
import { errorResponse } from "@/lib/ingestion/http";
import { IngestionError } from "@/lib/ingestion/validation";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw new IngestionError("登录后才能上传内容", 401);
    const input = await readManualRequest(request);
    const result = await prepareDraft({ ...input, userId: session.user.id });
    return Response.json({ success: true, requiresConfirmation: true, ...result });
  } catch (error) { return errorResponse(error); }
}
