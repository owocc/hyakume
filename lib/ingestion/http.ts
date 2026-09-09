import { IngestionError } from "./validation";

export const MAX_UPLOAD_BYTES = 1024 * 1024;

export async function readBoundedBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new IngestionError("上传内容过大", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new IngestionError("请求内容不能为空");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new IngestionError("上传内容过大", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export function decodeText(bytes: Uint8Array): string {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (/[\u0000-\u0008\u000e-\u001f]/.test(text)) throw new Error("binary");
    return text;
  } catch { throw new IngestionError("仅支持 UTF-8 文本文件，不支持二进制文件"); }
}

export async function readJson(request: Request, limit = 64 * 1024): Promise<Record<string, unknown>> {
  try {
    const body: unknown = JSON.parse(decodeText(await readBoundedBody(request, limit)));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("object required");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof IngestionError) throw error;
    throw new IngestionError("请求必须是有效 JSON 对象");
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof IngestionError) {
    return Response.json({ success: false, error: error.message, fieldErrors: error.fieldErrors }, { status: error.status });
  }
  console.error("Ingestion failed:", error);
  return Response.json({ success: false, error: "处理失败，请重试或使用手动上传" }, { status: 500 });
}
