import test from "node:test";
import assert from "node:assert/strict";

const databaseUrl = process.env.INGESTION_TEST_DATABASE_URL;

test("PostgreSQL draft isolation, explicit publication, retries, subpages and rollback", { skip: !databaseUrl }, async () => {
  process.env.DATABASE_URL = databaseUrl;
  const { prepareDraft } = await import("./pipeline");
  const { parseManualContent } = await import("./manual");
  const { loadDraft, publishDraft } = await import("./repository");
  const { validateReviewFields } = await import("./validation");
  const { getPool, getAppById } = await import("../db");
  const pool = getPool()!;
  const run = crypto.randomUUID();
  const user = `test_${run}`;
  const host = `review-${run}.example.com`;
  const fields = { name: "Color Desk", tagline: "面向设计师的颜色格式转换工具", description: "Color Desk 支持在浏览器中将 HEX、RGB 与 HSL 颜色格式互相转换，并复制转换结果用于设计稿和网页样式。", categories: ["WEB", "工具"], preview_features: [], developer: "", icon_url: "", cover_url: "" };
  const makeDraft = async (url: string) => prepareDraft({ userId: user, url, manual: parseManualContent(url, JSON.stringify(fields), "json") });
  try {
    const before = await makeDraft(`https://${host}/`);
    assert.equal(before.publishedAppId, undefined);
    assert.equal((await pool.query("select * from apps where id=$1", [host])).rowCount, 0);
    assert.equal((await pool.query("select status from tasks where id=$1", [before.draft.id])).rows[0].status, "awaiting_confirmation");
    assert.equal(await loadDraft(before.draft.id, "another-user"), null);
    assert.equal((await loadDraft(before.draft.id, user))?.draft.fields.name, fields.name);
    const validated = validateReviewFields(fields);
    const published = await Promise.all([publishDraft(before.draft, validated, user), publishDraft(before.draft, validated, user)]);
    assert.deepEqual(published, [host, host]);
    const app = (await pool.query("select * from apps where id=$1", [host])).rows[0];
    assert.equal(app.name, fields.name);
    assert.equal(app.rating, 0);
    assert.equal(app.rating_count, "0");
    assert.equal((await getAppById(host))?.rating, 0);
    assert.equal((await loadDraft(before.draft.id, user))?.draft.fields.name, fields.name);
    assert.equal(app.user_id, user);
    assert.equal((await pool.query("select status from tasks where id=$1", [before.draft.id])).rows[0].status, "completed");

    const subpage = await makeDraft(`https://${host}/docs`);
    assert.equal(subpage.draft.kind, "subpage");
    await publishDraft(subpage.draft, { ...validated, name: "Documentation" }, user);
    assert.equal((await pool.query("select name from apps where id=$1", [host])).rows[0].name, fields.name);
    assert.equal((await pool.query("select title from app_subpages where id=$1", ["sub_" + subpage.draft.id])).rows[0].title, "Documentation");
    await publishDraft(subpage.draft, validated, user);
    assert.equal((await pool.query("select * from app_subpages where id=$1", ["sub_" + subpage.draft.id])).rowCount, 1);

    const update = await makeDraft(`https://${host}/`);
    await pool.query("update apps set rating=4.2, user_id='original-owner' where id=$1", [host]);
    await publishDraft(update.draft, { ...validated, name: "Color Desk Updated" }, user);
    const updated = (await pool.query("select name,rating,user_id from apps where id=$1", [host])).rows[0];
    assert.equal(updated.name, "Color Desk Updated");
    assert.equal(updated.rating, 4.2);
    assert.equal(updated.user_id, "original-owner");

    const rollback = await makeDraft(`https://${host}/rollback`);
    await assert.rejects(publishDraft(rollback.draft, { ...validated, name: null as unknown as string }, user));
    assert.equal((await loadDraft(rollback.draft.id, user))?.publishedAppId, undefined);
    assert.equal((await pool.query("select * from app_subpages where id=$1", ["sub_" + rollback.draft.id])).rowCount, 0);
    await pool.query("update ingestion_drafts set created_at=0 where id=$1", [rollback.draft.id]);
    await assert.rejects(loadDraft(rollback.draft.id, user), /过期/);
  } finally {
    await pool.query("delete from apps where id=$1", [host]);
    await pool.query("delete from tasks where user_id=$1", [user]);
    await pool.query("delete from ingestion_drafts where user_id=$1", [user]);
    await pool.end();
  }
});
