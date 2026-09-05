import { getAppById, getReviews, insertReview } from "@/lib/db";
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
    if (!body.title || !body.content) {
      return Response.json({ success: false, error: "Title and content required" }, { status: 400 });
    }

    const review: ReviewItem = {
      id: `rev-${Date.now().toString(36)}`,
      app_id: id,
      title: body.title,
      author: body.author || "匿名用户",
      rating: Number(body.rating) || 5,
      date: new Date().toISOString().slice(0, 10).replace(/-/g, "/"),
      content: body.content,
      created_at: Date.now(),
    };

    await insertReview(review);
    return Response.json({ success: true, review }, { status: 201 });
  } catch (err) {
    console.error("Error submitting review:", err);
    return Response.json({ success: false, error: "Failed to submit review" }, { status: 500 });
  }
}
