import assert from "node:assert/strict";
import { test } from "node:test";
import type { CrawlResult } from "../crawler";
import { summarizeForReview, summarizeWithAgent, validateSummary } from "./summary";
import type { AgentRuntime } from "./runtime";

const crawl: CrawlResult = {
  url: "https://www.example.com/docs?ref=home#intro",
  title: "Canvas - Diagram editor",
  description: "Canvas edits diagrams and exports SVG files.",
  text: "Canvas edits diagrams and exports SVG files. Created by Acme Studio. Draw shapes, connect nodes, label edges, organize layers and adjust colors on the canvas. Export documents as SVG files for further editing in another application. The documentation describes keyboard commands and file import options.",
  iconUrl: "https://example.com/icon.png", coverUrl: "https://example.com/cover.png",
  screenshots: ["https://example.com/shot.png"], usedSeoImage: true,
  seoImage: "https://example.com/seo.png",
};
const complete = (value: unknown): AgentRuntime => ({ complete: async () => value });
const valid = {
  name: "Canvas", tagline: "Canvas edits diagrams and exports SVG files.",
  description: "Draw shapes, connect nodes, label edges, organize layers and adjust colors on the canvas.",
  categories: ["工具", "WEB"], developer: "Acme Studio",
};

test("summary makes exactly one call and never generates an article", async () => {
  let calls = 0;
  const { app, warnings } = await summarizeForReview(crawl, { complete: async (prompt) => {
    calls++;
    assert.match(prompt.system, /untrusted/);
    assert.match(prompt.system, /verbatim excerpt/);
    assert.equal(JSON.parse(prompt.user).source_url, crawl.url);
    return valid;
  } });
  assert.equal(calls, 1);
  assert.deepEqual(warnings, []);
  assert.equal(app.name, "Canvas");
  assert.equal(app.developer, "Acme Studio");
  assert.deepEqual(app.preview_features, []);
  assert.equal(app.articles, undefined);
  assert.deepEqual(app.related_topics, []);
  assert.equal(app.id, "example.com");
  assert.equal(app.url, "https://www.example.com");
  assert.equal(app.seo_image, crawl.seoImage);
});

test("unavailable provider preserves SEO and uses unknown, zero or empty metadata", async () => {
  const { app, warnings } = await summarizeForReview(crawl, { complete: async () => { throw new Error("AI is unavailable."); } });
  assert.equal(app.name, crawl.title);
  assert.equal(app.description, crawl.description);
  assert.equal(app.tagline, crawl.description);
  assert.equal(warnings.length, 1);
  assert.equal(app.rating, 0);
  assert.equal(app.rating_count, "0");
  assert.equal(app.price, "未知");
  assert.equal(app.compatibility, "未知");
  assert.equal(app.developer, "");
  assert.equal(app.developer_id, undefined);
  assert.equal(app.ranking, undefined);
  assert.equal(app.release_notes, "");
  assert.equal(app.trending, false);
  for (const value of [app.preview_features, app.categories, app.privacy_linked, app.privacy_not_linked, app.events]) assert.deepEqual(value, []);
});

for (const malformed of [
  null, [], "text", {}, { ...valid, name: {} }, { ...valid, developer: false },
  { ...valid, description: 5 }, { ...valid, tagline: ["Canvas"] },
  { ...valid, categories: ["toString"] }, { ...valid, categories: ["__proto__"] },
  { ...valid, categories: "WEB" }, { ...valid, preview_features: [null] },
  { ...valid, preview_features: "exports SVG files" }, { ...valid, preview_features: ["核心功能"] },
  { ...valid, description: "As an AI language model, I cannot browse this page." },
  { ...valid, description: "Canvas has bank-grade security and is completely free." },
  { ...valid, rating: 4.9 }, { ...valid, developer: "Official team" },
  { ...valid, name: '<img src="x" onerror="alert(1)">Canvas' },
]) {
  test(`rejects malformed or unsupported summary: ${JSON.stringify(malformed)}`, async () => {
    const { app, warnings } = await summarizeForReview(crawl, complete(malformed));
    assert.equal(app.description, crawl.description);
    assert.equal(app.name, crawl.title);
    assert.equal(warnings.length, 1);
  });
}

test("missing and empty optional fields preserve SEO without generic features", async () => {
  const app = await summarizeWithAgent(crawl, complete({ name: "Canvas", description: "", preview_features: [] }));
  assert.equal(app.description, crawl.description);
  assert.deepEqual(app.preview_features, []);
});

test("feature excerpts must occur in the source and retain array types", () => {
  assert.deepEqual(validateSummary({ ...valid, preview_features: ["exports SVG files"] }, crawl).preview_features, ["exports SVG files"]);
  assert.throws(() => validateSummary({ ...valid, preview_features: ["Supports secure cloud sync"] }, crawl), /source excerpts/);
});

test("blank source returns blanks and warns; text-only fallback is literal", async () => {
  const empty = { ...crawl, title: "", description: "", text: "" };
  const { app, warnings } = await summarizeForReview(empty, complete({}));
  assert.equal(app.name, "example.com");
  assert.equal(app.description, "");
  assert.equal(app.tagline, "");
  assert.equal(warnings.length, 2);
  assert.equal((await summarizeWithAgent({ ...empty, text: "Observed source text" }, complete({}))).description, "Observed source text");
});

test("GitHub repositories keep domain IDs and root URLs without invented GitHub prose", async () => {
  const app = await summarizeWithAgent({ ...crawl, url: "https://github.com/acme/canvas" }, complete(valid));
  assert.equal(app.id, "github.com");
  assert.equal(app.url, "https://github.com");
  assert.equal(app.rating, 0);
});
