import { getAllApps, insertApp } from "@/lib/db";
import type { AppItem } from "@/lib/types";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const featured = searchParams.has("featured") ? searchParams.get("featured") === "true" : undefined;
  const trending = searchParams.has("trending") ? searchParams.get("trending") === "true" : undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
  const userId = searchParams.get("userId") || undefined;

  try {
    const apps = await getAllApps({ category, featured, trending, limit, userId });
    return Response.json({ success: true, apps });
  } catch (err) {
    console.error("Failed to fetch apps:", err);
    return Response.json({ success: false, error: "Failed to fetch apps" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return Response.json(
        { success: false, error: "必须为注册用户，登录后才能发布新的应用" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as AppItem;
    if (!body.name || !body.url) {
      return Response.json({ success: false, error: "Name and URL are required" }, { status: 400 });
    }

    const app = await insertApp({
      ...body,
      user_id: session.user.id,
    });
    return Response.json({ success: true, app }, { status: 201 });
  } catch (err) {
    console.error("Failed to create app:", err);
    return Response.json({ success: false, error: "Failed to create app" }, { status: 500 });
  }
}
