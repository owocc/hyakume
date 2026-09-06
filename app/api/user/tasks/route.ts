import { auth } from "@/lib/auth";
import { getUserTasks, createTask } from "@/lib/db";
import type { PipelineTaskItem } from "@/lib/types";
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return Response.json(
        { success: false, error: "未登录或登录已过期" },
        { status: 401 }
      );
    }

    const tasks = await getUserTasks(session.user.id);
    const activeTasks = tasks.filter((t) => t.status === "processing");
    const completedTasks = tasks.filter((t) => t.status !== "processing");

    return Response.json({
      success: true,
      tasks,
      activeTasks,
      completedTasks,
      counts: {
        active: activeTasks.length,
        completed: completedTasks.length,
        total: tasks.length,
      },
    });
  } catch (err) {
    console.error("Failed to fetch user tasks:", err);
    return Response.json(
      { success: false, error: "获取任务列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return Response.json(
        { success: false, error: "必须为注册用户，登录后才能创建任务" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Partial<PipelineTaskItem>;
    if (!body.url) {
      return Response.json(
        { success: false, error: "必须提供目标网址 (URL)" },
        { status: 400 }
      );
    }

    const taskId =
      body.id ||
      "rec_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    let domain: string | undefined;
    try {
      domain = new URL(body.url).hostname;
    } catch {}

    const task: PipelineTaskItem = {
      id: taskId,
      user_id: session.user.id,
      url: body.url,
      domain,
      status: body.status || "processing",
      step: body.step || 1,
      step_name: body.step_name || "页面渲染与多端快照截取",
      progress: body.progress || 20,
      app_id: body.app_id,
      article_id: body.article_id,
      error: body.error,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const saved = await createTask(task);
    return Response.json({ success: true, task: saved }, { status: 201 });
  } catch (err) {
    console.error("Failed to create task:", err);
    return Response.json(
      { success: false, error: "创建任务失败" },
      { status: 500 }
    );
  }
}
