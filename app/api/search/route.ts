import { searchApps } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  try {
    const results = await searchApps(query);
    return Response.json({ success: true, query, apps: results });
  } catch (err) {
    console.error("Search error:", err);
    return Response.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
