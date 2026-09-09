import test from "node:test";
import assert from "node:assert/strict";

const databaseUrl = process.env.INGESTION_TEST_DATABASE_URL;

test("authenticated API requires review and prevents alternate publishing paths", { skip: !databaseUrl }, async (t) => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.BETTER_AUTH_SECRET = "local-ingestion-review-test-secret-not-for-production";
  const { auth } = await import("../auth");
  const { getPool } = await import("../db");
  const { POST: manual } = await import("../../app/api/analyze/manual/route");
  const { POST: confirm } = await import("../../app/api/analyze/confirm/route");
  const { POST: analyze, GET: load } = await import("../../app/api/analyze/route");
  const { POST: legacy } = await import("../../app/api/apps/route");
  const { POST: article } = await import("../../app/api/articles/generate/route");
  const pool = getPool()!;
  const run = crypto.randomUUID();
  const host = `api-${run}.example.com`;
  const users: string[] = [];
  const signup = async () => {
    const response = await auth.api.signUpEmail({ body: { name: "Review Test", email: `${crypto.randomUUID()}@example.test`, password: "Local-test-password-123456" }, asResponse: true });
    assert.equal(response.status, 200);
    const data = await response.clone().json() as { user: { id: string } };
    users.push(data.user.id);
    return response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
  };
  const request = (body: unknown, cookie = "") => new Request("http://localhost:3000/api/analyze", {
    method: "POST", headers: { "Content-Type": "application/json", cookie }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await manual(request({ url: `https://${host}` }))).status, 401);
    assert.equal((await analyze(request({ url: `https://${host}` }))).status, 401);
    assert.equal((await confirm(request({ draftId: "guess_id", confirmed: true }))).status, 401);
    const cookie = await signup();
    const otherCookie = await signup();
    t.mock.method(globalThis, "fetch", async () => new Response('<title>Color Desk</title><meta content="Color conversion for designers with HEX RGB and HSL formats" name="description"><body>Convert color formats and copy results into stylesheets.</body>', { headers: { "content-type": "text/html" } }));
    const analyzed = await analyze(request({ url: `https://${host}/` }, cookie));
    assert.equal(analyzed.status, 200);
    const preview = await analyzed.json() as { draft: import("./types").IngestionDraft; requiresConfirmation: boolean };
    assert.equal(preview.requiresConfirmation, true);
    assert.equal(preview.draft.crawl.seo?.title, "Color Desk");
    assert.ok(preview.draft.warnings.length);
    assert.equal((await pool.query("select * from apps where id=$1", [host])).rowCount, 0);
    const response = await manual(request({ url: `https://${host}/`, content: "这个工具支持设计师将 HEX、RGB 与 HSL 颜色格式互相转换，并且可以复制转换结果用于设计稿和网页样式。" }, cookie));
    assert.equal(response.status, 200);
    const { draft } = await response.json() as { draft: import("./types").IngestionDraft };
    assert.equal((await pool.query("select * from apps where id=$1", [host])).rowCount, 0);
    assert.equal((await confirm(request({ draftId: draft.id, fields: draft.fields }, cookie))).status, 422);
    assert.equal((await confirm(request({ draftId: draft.id, fields: draft.fields, confirmed: true }, cookie))).status, 422);
    assert.equal((await load(new Request(`http://localhost:3000/api/analyze?draftId=${draft.id}`, { headers: { cookie: otherCookie } }))).status, 404);
    assert.equal((await confirm(request({ draftId: draft.id, fields: draft.fields, confirmed: true }, otherCookie))).status, 404);
    const fields = { ...draft.fields, name: "Color Desk", tagline: "用于设计稿的颜色格式转换工具" };
    const publish = await confirm(request({ draftId: draft.id, fields, confirmed: true }, cookie));
    assert.equal(publish.status, 200);
    assert.equal(((await publish.json()) as { appId: string }).appId, host);
    const reload = await load(new Request(`http://localhost:3000/api/analyze?draftId=${draft.id}`, { headers: { cookie } }));
    assert.equal(((await reload.json()) as { publishedAppId: string }).publishedAppId, host);
    assert.equal((await legacy(request({ name: "Bypass", url: "https://bypass.example.com" }, cookie))).status, 409);
    assert.equal((await article(request({ url: "https://uncollected.example.com" }, cookie))).status, 422);
  } finally {
    await pool.query("delete from apps where id=$1", [host]);
    await pool.query("delete from tasks where user_id=any($1)", [users]);
    await pool.query("delete from ingestion_drafts where user_id=any($1)", [users]);
    await pool.query('delete from "user" where id=any($1)', [users]);
    await pool.end();
  }
});
