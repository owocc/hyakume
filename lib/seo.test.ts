import assert from "node:assert/strict";
import test from "node:test";
import { crawlWebsite } from "./crawler";
import { extractSeoMetadata } from "./seo";
import { normalizeUrl } from "./url";

const base = "https://example.com/products/page";

test("extracts reordered, mixed-case, single/double/unquoted metadata and relative links", () => {
  const html = `<HTML><HEAD>
    <TITLE>Document title</TITLE>
    <META CONTENT='Open &amp; Graph' PROPERTY=OG:TITLE>
    <meta content="Twitter title" name="twitter:title">
    <META content='A &quot;useful&quot; description' NAME=DESCRIPTION>
    <meta content='og description' property='og:description'>
    <meta CONTENT='one, two' name=keywords>
    <meta content='Example Inc' property=og:site_name>
    <meta content=../cover.png property=og:image>
    <meta content='#123456' NAME=THEME-COLOR>
    <link href=/canonical REL=CANONICAL>
    <link href='//cdn.example.com/favicon?v=2&amp;size=32' REL='shortcut ICON'>
  </HEAD></HTML>`;
  const seo = extractSeoMetadata(html, base);
  assert.equal(seo.title, "Open & Graph");
  assert.equal(seo.description, "og description");
  assert.equal(seo.keywords, "one, two");
  assert.equal(seo.siteName, "Example Inc");
  assert.equal(seo.imageUrl, "https://example.com/cover.png");
  assert.equal(seo.canonicalUrl, "https://example.com/canonical");
  assert.equal(seo.iconUrl, "https://cdn.example.com/favicon?v=2&size=32");
  assert.equal(seo.themeColor, "#123456");
  assert.equal(seo.raw.html, html);
  assert.equal(seo.raw.meta[2].content, 'A "useful" description');
  assert.deepEqual(seo.raw.titles, ["Document title"]);
});

test("decodes HTML named, decimal, hexadecimal and non-BMP entities once", () => {
  const seo = extractSeoMetadata(`<title>&copy; &eacute; &#39; &#x1F680; &amp;lt;</title><meta name=description content='A &gt; B &amp; C &apos;x&apos; &NotEqualTilde;'>`, base);
  assert.equal(seo.title, "© é ' 🚀 &lt;");
  assert.equal(seo.description, "A > B & C 'x' ≂̸");
});

test("keeps duplicate and unknown raw fields with stable first-nonempty priority", () => {
  const seo = extractSeoMetadata(`<meta name=twitter:title content=Twitter>
    <meta property=og:title content=' '><meta property=og:title content=First><meta property=og:title content=Second>
    <meta name=robots content=noindex><meta name=unknown content=untouched><meta charset=utf-8>
    <link href=/alternate rel=alternate hreflang=fr>`, base);
  assert.equal(seo.title, "First");
  assert.equal(seo.raw.meta.length, 7);
  assert.equal(seo.raw.meta[4].content, "noindex");
  assert.equal(seo.raw.meta[6].charset, "utf-8");
  assert.equal(seo.raw.links[0].hreflang, "fr");
});

test("uses Twitter then standard values without synthesizing missing fields", () => {
  const seo = extractSeoMetadata(`<title>Document</title><meta name=twitter:title content=Twitter>
    <meta name=twitter:description content=Summary><meta name=twitter:image content=/twitter.png>`, base);
  assert.equal(seo.title, "Twitter");
  assert.equal(seo.description, "Summary");
  assert.equal(seo.imageUrl, "https://example.com/twitter.png");
  assert.equal(seo.canonicalUrl, "");
  assert.equal(seo.iconUrl, "");
  const missing = extractSeoMetadata("<body>Plain text</body>", base);
  for (const field of ["title", "description", "keywords", "canonicalUrl", "siteName", "imageUrl", "iconUrl", "themeColor"] as const) assert.equal(missing[field], "");
});

test("honors HTML base and ignores invalid URL schemes while retaining raw declarations", () => {
  const seo = extractSeoMetadata(`<base href=https://cdn.example.com/assets/>
    <meta property=og:image content=javascript:alert(1)><meta name=twitter:image content=card.png>
    <link rel=canonical href='data:text/html,test'><link rel=icon href='data:,'>
    <link rel=apple-touch-icon href=/apple.png>`, base);
  assert.equal(seo.imageUrl, "https://cdn.example.com/assets/card.png");
  assert.equal(seo.iconUrl, "https://cdn.example.com/apple.png");
  assert.equal(seo.canonicalUrl, "");
  assert.equal(seo.raw.meta[0].content, "javascript:alert(1)");
});

test("does not parse comments, scripts, textarea text or template contents as SEO", () => {
  const seo = extractSeoMetadata(`<!-- <meta name=description content=fake> -->
    <script>const x = '<meta property="og:title" content="fake">';</script>
    <title>Real > title</title><meta content='Real > description' name=description>
    <template><meta property=og:title content=fake></template>
    <textarea><meta name=description content=fake></textarea>`, base);
  assert.equal(seo.title, "Real > title");
  assert.equal(seo.description, "Real > description");
  assert.equal(seo.raw.meta.length, 1);
});

test("normalizes public HTTP(S) URLs and rejects local/private numeric variants", () => {
  assert.equal(normalizeUrl(" Example.COM/path "), "https://example.com/path");
  assert.equal(normalizeUrl("HTTP://Example.com:80/"), "http://example.com/");
  assert.equal(normalizeUrl("example.com:8080/path"), "https://example.com:8080/path");
  assert.equal(normalizeUrl("https://[2606:4700:4700::1111]/"), "https://[2606:4700:4700::1111]/");
  for (const url of ["", "garbage", "ftp://example.com", "javascript:alert(1)", "https://user:pass@example.com", "http://localhost", "http://service.local", "http://service.internal", "http://127.0.0.1", "http://127.1", "http://2130706433", "http://0x7f000001", "http://10.1.2.3", "http://172.16.0.1", "http://192.168.1.1", "http://169.254.169.254", "http://100.64.0.1", "http://[::]", "http://[::1]", "http://[::ffff:127.0.0.1]", "http://[fc00::1]", "http://[fe80::1]", "http://[2001:db8::1]", "https://example.com\\@127.0.0.1"])
    assert.throws(() => normalizeUrl(url), Error, url);
});

test("HTTP crawl extracts actual metadata and page text without fabricated icon or cover", async (t) => {
  t.mock.method(globalThis, "fetch", async () => htmlResponse(`<title>Actual &amp; title</title><meta content=Description name=description><body>Hello &amp; world<script>secret</script></body>`, { headers: { "content-type": "text/html" } }));
  const crawl = await crawlWebsite(base);
  assert.equal(crawl.title, "Actual & title");
  assert.equal(crawl.description, "Description");
  assert.equal(crawl.text, "Hello & world");
  assert.equal(crawl.seo?.title, crawl.title);
  assert.equal(crawl.iconUrl, "");
  assert.equal(crawl.coverUrl, "");
  assert.deepEqual(crawl.screenshots, []);
});

test("failed HTTP remains empty and truthful", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new Error("network unavailable"); });
  const crawl = await crawlWebsite(base);
  assertEmpty(crawl);
  assert.match(crawl.warnings?.join(" ") || "", /HTTP crawl failed/);
  assert.equal(crawl.seo, undefined);
});

test("non-2xx metadata is retained as source but not used as product content", async (t) => {
  t.mock.method(globalThis, "fetch", async () => htmlResponse("<title>Gateway error</title><meta name=description content='Not a product'>", { status: 502 }));
  const crawl = await crawlWebsite(base);
  assertEmpty(crawl);
  assert.equal(crawl.seo?.raw.titles[0], "Gateway error");
  assert.match(crawl.warnings?.join(" ") || "", /HTTP 502/);
});

test("200 blocked/challenge page is not treated as a product", async (t) => {
  t.mock.method(globalThis, "fetch", async () => htmlResponse("<title>Just a moment...</title><body>Please enable JavaScript and cookies to continue</body>"));
  const crawl = await crawlWebsite(base);
  assertEmpty(crawl);
  assert.equal(crawl.seo?.raw.titles[0], "Just a moment...");
  assert.match(crawl.warnings?.join(" ") || "", /access challenge/);
});

test("page without metadata does not manufacture product content", async (t) => {
  t.mock.method(globalThis, "fetch", async () => htmlResponse("<body>Some unrelated text</body>"));
  const crawl = await crawlWebsite(base);
  assertEmpty(crawl);
  assert.match(crawl.warnings?.join(" ") || "", /No usable SEO/);
});

test("rejects private redirects before making a second request", async (t) => {
  const mocked = t.mock.method(globalThis, "fetch", async () => htmlResponse(null, { status: 302, headers: { location: "http://169.254.169.254/latest" } }));
  const crawl = await crawlWebsite(base);
  assertEmpty(crawl);
  assert.equal(mocked.mock.callCount(), 1);
});

test("resolves metadata relative to final HTTP redirect location", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request) => String(url) === base
    ? htmlResponse(null, { status: 302, headers: { location: "/moved/" } })
    : htmlResponse("<meta property=og:title content=Moved><meta property=og:image content=cover.png>"));
  const crawl = await crawlWebsite(base);
  assert.equal(crawl.seo?.sourceUrl, "https://example.com/moved/");
  assert.equal(crawl.seoImage, "https://example.com/moved/cover.png");
});

test("non-HTML and oversized responses stay empty", async (t) => {
  const mocked = t.mock.method(globalThis, "fetch", async () => htmlResponse('{"title":"not HTML"}', { headers: { "content-type": "application/json" } }));
  assertEmpty(await crawlWebsite(base));
  mocked.mock.mockImplementation(async () => htmlResponse("<title>Too large</title>", { headers: { "content-type": "text/html", "content-length": String(3 * 1024 * 1024) } }));
  assertEmpty(await crawlWebsite(base));
});

test("rendered SEO survives screenshot capture and storage failures and closes browser", async (t) => {
  const { default: puppeteer } = await import("@cloudflare/puppeteer");
  const root = globalThis as unknown as { __env__?: Record<string, unknown> };
  const previous = root.__env__;
  root.__env__ = { MYBROWSER: {}, BUCKET: { put: async () => { throw new Error("storage unavailable"); } } };
  t.after(() => { root.__env__ = previous; });
  let closed = false;
  let captures = 0;
  const html = "<title>Rendered title</title><meta name=description content='Rendered description'><body>Actual body</body>";
  const page = {
    setRequestInterception: async () => {},
    on: () => {},
    setViewport: async () => {},
    goto: async () => ({ status: () => 200 }),
    waitForNetworkIdle: async () => {},
    url: () => base,
    content: async () => html,
    screenshot: async () => {
      captures++;
      if (captures === 2) throw new Error("tablet unavailable");
      return new Uint8Array([1, 2, 3]);
    },
  };
  t.mock.method(puppeteer, "launch", async () => ({ newPage: async () => page, close: async () => { closed = true; } }));
  const fetchMock = t.mock.method(globalThis, "fetch", async () => { throw new Error("HTTP must not be needed"); });
  const crawl = await crawlWebsite(base);
  assert.equal(crawl.title, "Rendered title");
  assert.equal(crawl.description, "Rendered description");
  assert.deepEqual(crawl.seo, extractSeoMetadata(html, base));
  assert.deepEqual(crawl.screenshotBuffer, new Uint8Array([1, 2, 3]));
  assert.equal(crawl.coverUrl, "");
  assert.match(crawl.warnings?.join(" ") || "", /tablet screenshot capture failed/);
  assert.match(crawl.warnings?.join(" ") || "", /pc screenshot upload failed/);
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(closed, true);
});

function htmlResponse(body: BodyInit | null, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) headers.set("content-type", "text/html");
  return new Response(body, { ...init, headers });
}

function assertEmpty(crawl: Awaited<ReturnType<typeof crawlWebsite>>) {
  assert.equal(crawl.title, "");
  assert.equal(crawl.description, "");
  assert.equal(crawl.text, "");
  assert.equal(crawl.coverUrl, "");
  assert.equal(crawl.iconUrl, "");
  assert.deepEqual(crawl.screenshots, []);
  assert.equal(crawl.usedSeoImage, false);
}
