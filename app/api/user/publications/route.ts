import { auth } from "@/lib/auth";
import {
  getUserPublications,
  getAllApps,
  getAllArticles,
} from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return Response.json(
        { success: false, error: "未登录或登录已过期，请重新登录" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "user"; // "user" | "system" | "all"
    const targetUserId = scope === "system" ? "system" : session.user.id;

    if (scope === "all") {
      const [apps, articles] = await Promise.all([
        getAllApps({ limit: 100 }),
        getAllArticles({ limit: 100 }),
      ]);
      return Response.json({
        success: true,
        user: session.user,
        scope: "all",
        apps,
        articles,
        subpages: [],
        counts: {
          apps: apps.length,
          articles: articles.length,
          subpages: 0,
          total: apps.length + articles.length,
        },
      });
    }

    const { apps, articles, subpages } = await getUserPublications(targetUserId);

    return Response.json({
      success: true,
      user: session.user,
      scope,
      apps,
      articles,
      subpages,
      counts: {
        apps: apps.length,
        articles: articles.length,
        subpages: subpages.length,
        total: apps.length + articles.length + subpages.length,
      },
    });
  } catch (err) {
    console.error("Failed to fetch user publications:", err);
    return Response.json(
      { success: false, error: "获取发布内容失败" },
      { status: 500 }
    );
  }
}
