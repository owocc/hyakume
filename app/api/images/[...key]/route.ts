import { getImageFromStorage } from "@/lib/storage";

export async function GET(
  _request: Request,
  props: { params: Promise<{ key: string[] }> }
) {
  const params = await props.params;
  const key = Array.isArray(params.key) ? params.key.join("/") : params.key;

  if (!key) {
    return new Response("Missing image key", { status: 400 });
  }

  const image = await getImageFromStorage(key);
  if (!image) {
    return new Response("Image not found", { status: 404 });
  }

  return new Response(image.data as unknown as BodyInit, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
