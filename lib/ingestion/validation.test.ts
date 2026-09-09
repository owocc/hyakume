import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_FIELDS, validateReviewFields, requireConfirmation, IngestionError } from "./validation";
import { parseManualContent, readManualRequest } from "./manual";
import { readJson } from "./http";

const fields = { ...EMPTY_FIELDS, name: "Color Desk", tagline: "面向设计师的颜色格式转换工具", description: "Color Desk 支持在浏览器中将 HEX、RGB 与 HSL 颜色格式互相转换，并复制转换结果用于设计稿和网页样式。" };

test("confirmation requires actual boolean true", () => {
  for (const value of [undefined, false, "true", 1]) assert.throws(() => requireConfirmation(value));
  assert.doesNotThrow(() => requireConfirmation(true));
});
test("review validates types, concrete content, enum membership and image protocols", () => {
  assert.equal(validateReviewFields(fields).name, "Color Desk");
  for (const patch of [
    { name: "test" }, { name: "aaaaaaaa" }, { tagline: "abcabcabcabcabcabc" },
    { description: "placeholder" }, { name: {} }, { categories: ["constructor"] },
    { preview_features: [42] }, { icon_url: "javascript:alert(1)" }, { cover_url: "//example.com/image.png" },
  ]) assert.throws(() => validateReviewFields({ ...fields, ...patch }), IngestionError);
});
test("manual HTML extracts SEO without executing scripts", () => {
  const { crawl } = parseManualContent("https://example.com/", '<meta content="Design &amp; Color" property="og:title"><meta name="description" content="Convert colors"><script>globalThis.manualExecuted = true</script>', "html");
  assert.equal(crawl.title, "Design & Color");
  assert.equal(crawl.description, "Convert colors");
  assert.equal(crawl.text, "");
  assert.ok(crawl.seo?.raw.html.includes("script"));
  assert.equal((globalThis as Record<string, unknown>).manualExecuted, undefined);
});
test("blocked uploaded HTML is provenance only and not a publishable fallback", () => {
  const { crawl } = parseManualContent("https://example.com/", "<title>Access denied</title><body>Forbidden</body>", "html");
  assert.equal(crawl.title, "");
  assert.equal(crawl.seo?.title, "Access denied");
  assert.ok(crawl.warnings?.length);
});
test("manual JSON ignores identity and ownership and rejects malformed types", () => {
  const data = parseManualContent("https://example.com/", JSON.stringify({ ...fields, id: "admin", user_id: "someone", confirmed: true }), "json");
  assert.equal(data.fields?.name, fields.name);
  assert.equal((data.fields as Record<string, unknown>).id, undefined);
  assert.throws(() => parseManualContent("https://example.com/", '{"name":{}}', "json"));
  assert.throws(() => parseManualContent("https://example.com/", "[1]", "json"));
});
test("bounded requests reject bad JSON, unsupported uploads, binary and oversized files", async () => {
  await assert.rejects(readJson(new Request("https://local/", { method: "POST", body: "not JSON" })), IngestionError);
  for (const [filename, content] of [["test.png", "binary"], ["test.txt", "\u0000"], ["test.txt", "x".repeat(1024 * 1024 + 1)]]) {
    const form = new FormData();
    form.set("url", "https://example.com");
    form.set("file", new File([content], filename));
    await assert.rejects(readManualRequest(new Request("https://local/", { method: "POST", body: form })), IngestionError);
  }
});
test("manual JSON API supports empty form and does not fetch", async () => {
  const result = await readManualRequest(new Request("https://local/", { method: "POST", body: JSON.stringify({ url: "example.com" }) }));
  assert.equal(result.url, "https://example.com/");
  assert.equal(result.manual.crawl.title, "");
});
