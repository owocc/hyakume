import { auth } from "@/lib/auth";
import { deleteArticle, getArticleById } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return Response.json(
        { success: false, error: "未登录或登录已过期" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const article = await getArticleById(id);
    if (!article) {
      return Response.json(
        { success: false, error: "文章不存在或已被删除" },
        { status: 404 }
      );
    }

    if (article.user_id !== session.user.id) {
      return Response.json(
        { success: false, error: "无权删除非本人发布的文章" },
        { status: 403 }
      );
    }

    const success = await deleteArticle(id, session.user.id);
    return Response.json({ success });
  } catch (err) {
    console.error("Failed to delete article:", err);
    return Response.json(
      { success: false, error: "删除文章失败" },
      { status: 500 }
    );
  }
}
