import { crawlWebsite } from "@/lib/crawler";
import { summarizeWithAgent } from "@/lib/agent";
import { insertApp, getAppByDomain } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const rawUrl = body.url?.trim();

    if (!rawUrl) {
      return Response.json(
        { success: false, error: "请提供有效的网址 (URL)" },
        { status: 400 }
      );
    }

    // Check if domain is already recorded
    const existingApp = await getAppByDomain(rawUrl);
    if (existingApp) {
      return Response.json({
        success: true,
        alreadyExists: true,
        app: existingApp,
        crawl: {
          url: existingApp.url,
          title: existingApp.name,
          usedSeoImage: Boolean(existingApp.seo_image),
          coverUrl: existingApp.cover_url,
        },
        steps: [
          { step: 1, name: "页面渲染与快照截取", status: "completed" },
          { step: 2, name: "提取网页元数据与文本", status: "completed" },
          { step: 3, name: "封面图决策与 R2 存储处理", status: "completed" },
          { step: 4, name: "AI Agent 总结应用功能与特色", status: "completed" },
          { step: 5, name: "结构化写入 Cloudflare D1 数据库", status: "completed" },
        ],
      });
    }
    const steps = [
      { step: 1, name: "页面渲染与多端快照截取 (PC / 平板 / 手机)", status: "processing" },
      { step: 2, name: "提取网页元数据与文本", status: "pending" },
      { step: 3, name: "多端截图与封面图存储至 Storage (R2)", status: "pending" },
      { step: 4, name: "AI Agent 总结应用功能与特色", status: "pending" },
      { step: 5, name: "结构化写入数据库", status: "pending" },
    ];

    // 1. Crawl website & capture screenshot/metadata
    const crawlResult = await crawlWebsite(rawUrl);
    steps[0].status = "completed";
    steps[1].status = "completed";

    // 2. Cover image report
    steps[2].status = "completed";

    // 3. AI Agent summary
    const appData = await summarizeWithAgent(crawlResult);
    steps[3].status = "completed";

    // 4. Save to Cloudflare D1
    const savedApp = await insertApp(appData);
    steps[4].status = "completed";

    return Response.json({
      success: true,
      app: savedApp,
      crawl: {
        url: crawlResult.url,
        title: crawlResult.title,
        usedSeoImage: crawlResult.usedSeoImage,
        coverUrl: crawlResult.coverUrl,
        screenshots: crawlResult.screenshots,
        deviceScreenshots: crawlResult.deviceScreenshots,
      },
      steps,
    });
  } catch (err) {
    console.error("Analysis pipeline error:", err);
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "分析网页失败，请重试",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url")?.trim();
  if (!rawUrl) {
    return Response.json({ success: false, error: "请提供有效的网址 (URL)" }, { status: 400 });
  }

  const app = await getAppByDomain(rawUrl);
  return Response.json({
    success: true,
    exists: Boolean(app),
    app,
  });
}
