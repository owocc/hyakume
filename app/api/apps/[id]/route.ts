import { getAppById, getReviews, insertReview, deleteApp } from "@/lib/db";
import type { ReviewItem } from "@/lib/types";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  if (!id) {
    return Response.json({ success: false, error: "App ID required" }, { status: 400 });
  }

  try {
    const app = await getAppById(id);
    if (!app) {
      return Response.json({ success: false, error: "App not found" }, { status: 404 });
    }

    const reviews = await getReviews(id);
    return Response.json({ success: true, app, reviews });
  } catch (err) {
    console.error("Error fetching app detail:", err);
    return Response.json({ success: false, error: "Failed to fetch app detail" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  if (!id) {
    return Response.json({ success: false, error: "App ID required" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Partial<ReviewItem>;
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    const title = (body.title || "").trim() || `${rating} 星评价`;
    const content = (body.content || "").trim() || `用户给出了 ${rating} 星评分`;
    const author = (body.author || "").trim() || "认证用户";

    const review: ReviewItem = {
      id: `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      app_id: id,
      title,
      author,
      rating,
      date: new Date().toISOString().slice(0, 10).replace(/-/g, "/"),
      content,
      created_at: Date.now(),
    };

    await insertReview(review);
    return Response.json({ success: true, review }, { status: 201 });
  } catch (err) {
    console.error("Error submitting review:", err);
    return Response.json({ success: false, error: "Failed to submit review" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  if (!id) {
    return Response.json({ success: false, error: "App ID required" }, { status: 400 });
  }
  try {
    await deleteApp(id);
    return Response.json({ success: true, deleted: id });
  } catch (err) {
    console.error("Error deleting app:", err);
    return Response.json({ success: false, error: "Failed to delete app" }, { status: 500 });
  }
}
