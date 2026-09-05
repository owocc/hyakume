import { crawlWebsite } from "@/lib/crawler";
import { summarizeWithAgent } from "@/lib/agent";
import { insertApp } from "@/lib/db";

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

    const steps = [
      { step: 1, name: "页面渲染与快照截取", status: "processing" },
      { step: 2, name: "提取网页元数据与文本", status: "pending" },
      { step: 3, name: "封面图决策与 R2 存储处理", status: "pending" },
      { step: 4, name: "AI Agent 总结应用功能与特色", status: "pending" },
      { step: 5, name: "结构化写入 Cloudflare D1 数据库", status: "pending" },
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
