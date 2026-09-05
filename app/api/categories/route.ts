import { getCategories } from "@/lib/db";

export async function GET() {
  try {
    const categories = await getCategories();
    return Response.json({ success: true, categories });
  } catch (err) {
    console.error("Failed to get categories:", err);
    return Response.json(
      { success: false, error: "Failed to get categories" },
      { status: 500 }
    );
  }
}
