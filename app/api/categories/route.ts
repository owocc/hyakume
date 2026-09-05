import { FIXED_CATEGORIES } from "@/lib/db";

export async function GET() {
  const categories = FIXED_CATEGORIES.map((name) => ({
    id: name,
    name,
  }));
  return Response.json({ success: true, categories });
}

export async function POST() {
  // Manual category addition is disabled per design requirement
  return Response.json(
    {
      success: false,
      error: "分类已固定为【工具、WEB、AI】，不允许手动添加分类",
    },
    { status: 403 }
  );
}
