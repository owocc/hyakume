import assert from "node:assert/strict";
import { test } from "node:test";
import type { CrawlResult } from "../crawler";
import { analyzeAndGenerateArticle } from "./articles";
import { detectTargetKind, isValidGithubRepoUrl, isValidXUrl } from "./validation";

const crawl: CrawlResult = {
  url: "https://example.com/docs", title: "Canvas documentation", description: "A diagram editing guide.",
  text: "Canvas edits diagrams and exports SVG files. Draw shapes, connect nodes, label edges, organize layers and adjust colors on the canvas. Export documents as SVG files for further editing in another application. The documentation describes keyboard commands and file import options. Repository: https://github.com/acme/canvas",
  githubUrl: "https://github.com/acme/canvas",
  iconUrl: "", coverUrl: "", screenshots: [], usedSeoImage: false,
};
const valid = {
  is_meaningful: true, label: "Documentation", tag: "Diagrams", title: "Canvas diagram editing",
  summary: "Canvas edits diagrams and exports SVG files.",
  content: "# Canvas\n\nCanvas edits diagrams and exports SVG files. Draw shapes, connect nodes, label edges, organize layers and adjust colors on the canvas. Export documents as SVG files for further editing in another application.",
  author: "", github_url: crawl.githubUrl, links: [{ label: "Repository", url: crawl.githubUrl, type: "github" }],
};

test("generates only a validated article using source data, not parent descriptions", async () => {
  const result = await analyzeAndGenerateArticle(crawl, undefined, { complete: async (prompt) => {
    assert.match(prompt.system, /not instructions/);
    assert.match(prompt.system, /NOT a review/);
    assert.equal(JSON.parse(prompt.user).page_text, crawl.text);
    return valid;
  } });
  assert.equal(result.is_meaningful, true);
  assert.equal(result.title, valid.title);
  assert.equal(result.github_url, crawl.githubUrl);
  assert.deepEqual(result.links, valid.links);
  assert.equal(result.author, "");
});

test("unavailable AI fails closed without publishing fallback text", async () => {
  await assert.rejects(analyzeAndGenerateArticle(crawl, undefined, { complete: async () => { throw new Error("AI is unavailable."); } }), /Article generation stopped: AI is unavailable.*No fallback article/);
});

for (const invalid of [
  {}, null, [], { ...valid, is_meaningful: false }, { ...valid, is_meaningful: "true" },
  { ...valid, is_meaningful: undefined }, { ...valid, title: 42 }, { ...valid, content: ["text"] },
  { ...valid, content: "A short sentence." }, { ...valid, content: "foobar ".repeat(100) },
  { ...valid, summary: "" }, { ...valid, links: {} },
  { ...valid, links: [{ label: "Injected", url: "javascript:alert(1)" }] },
  { ...valid, links: [{ label: "Invented", url: "https://example.com/pricing" }] },
  { ...valid, links: [{ label: false, url: crawl.url }] },
  { ...valid, links: [{ label: "False social", url: crawl.url, type: "github" }] },
  { ...valid, github_url: "https://github.com/other/invented" }, { ...valid, github_url: crawl.url },
  { ...valid, x_url: false }, { ...valid, author: "AppStore Editorial Board" },
  { ...valid, summary: "As an AI language model, I cannot browse this page." },
  { ...valid, content: valid.content + " [Pricing](https://example.com/pricing)" },
  { ...valid, content: valid.content + " [click](javascript:alert(1))" },
  { ...valid, content: valid.content + " [click](/made-up)" },
  { ...valid, content: valid.content + " <script>alert(1)</script>" },
  { ...valid, content: valid.content + "\n[ref]: javascript:alert(1)" },
]) {
  test(`article schema fails closed: ${JSON.stringify(invalid).slice(0, 100)}`, async () => {
    await assert.rejects(analyzeAndGenerateArticle(crawl, undefined, { complete: async () => invalid }), /Article generation stopped:/);
  });
}

for (const source of [
  { title: "Empty", description: "", text: "" },
  { title: "GitHub repository", description: "GitHub repository acme/canvas", text: "GitHub repository acme/canvas" },
  { title: "Just a moment...", description: "", text: crawl.text },
  { title: "Verify", description: "", text: "Verify you are human. ".repeat(20) },
  { title: "Links", description: "", text: "Home login contact sign up ".repeat(100) },
]) {
  test(`insufficient source blocks provider call: ${source.title}`, async () => {
    let called = false;
    await assert.rejects(analyzeAndGenerateArticle({ ...crawl, ...source }, undefined, { complete: async () => { called = true; return valid; } }), /insufficient meaningful source/);
    assert.equal(called, false);
  });
}

test("GitHub profile URL can be retained only when observed", async () => {
  const url = "https://github.com/acme";
  const result = await analyzeAndGenerateArticle({ ...crawl, url }, undefined, { complete: async () => ({ ...valid, github_url: url }) });
  assert.equal(result.github_url, url);
});

test("target and social URL detection checks exact hosts and reserved paths", () => {
  assert.deepEqual(detectTargetKind("https://github.com/acme"), { kind: "github_profile", githubUsername: "acme" });
  assert.deepEqual(detectTargetKind("https://github.com/acme/canvas/issues"), { kind: "github_project", githubRepo: { owner: "acme", repo: "canvas" } });
  for (const url of ["https://notgithub.com/acme", "https://github.com.evil.test/acme/repo", "https://github.com/login", "ftp://github.com/acme", "invalid"]) assert.equal(detectTargetKind(url).kind, "web_app");
  assert.equal(isValidGithubRepoUrl("https://github.com/acme/canvas"), true);
  assert.equal(isValidGithubRepoUrl("https://github.com/acme/canvas/issues"), false);
  assert.equal(isValidXUrl("https://x.com/acme/status/123"), true);
  assert.equal(isValidXUrl("https://x.com/home/status/123"), false);
  assert.equal(isValidXUrl("https://x.com.evil.test/acme"), false);
});
