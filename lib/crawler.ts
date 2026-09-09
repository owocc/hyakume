import { getCloudflareEnv } from "./cf-env";
import { uploadImageToR2 } from "./storage";
import { extractPageText, extractSeoMetadata, hasSeoMetadata, isBlockedPage, type SeoMetadata } from "./seo";
import { normalizeUrl } from "./url";

export { normalizeUrl } from "./url";
export type { SeoMetadata } from "./seo";

export interface DeviceScreenshots {
  pc?: string;
  tablet?: string;
  mobile?: string;
}

export interface CrawlResult {
  url: string;
  title: string;
  description: string;
  text: string;
  seo?: SeoMetadata;
  warnings?: string[];
  seoImage?: string;
  iconUrl: string;
  coverUrl: string;
  primaryColor?: string;
  screenshots: string[];
  screenshotBuffer?: Uint8Array;
  deviceScreenshots?: DeviceScreenshots;
  usedSeoImage: boolean;
  githubUrl?: string;
  xUrl?: string;
}

export const DEVICE_VIEWPORTS = {
  pc: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
} as const;

const MAX_HTML_BYTES = 2 * 1024 * 1024;

async function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), milliseconds); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function readHtml(response: Response): Promise<string> {
  if (Number(response.headers.get("content-length")) > MAX_HTML_BYTES) {
    await response.body?.cancel();
    throw new Error("HTML exceeds the 2 MiB crawl limit");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let html = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) throw new Error("HTML exceeds the 2 MiB crawl limit");
      html += decoder.decode(value, { stream: true });
    }
    return html + decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function crawlWebsite(targetUrl: string, options?: { isSubpage?: boolean }): Promise<CrawlResult> {
  const url = normalizeUrl(targetUrl);
  const parsedUrl = new URL(url);
  const warnings: string[] = [];
  const result: CrawlResult = {
    url, title: "", description: "", text: "", iconUrl: "", coverUrl: "", screenshots: [], usedSeoImage: false,
  };
  let accepted = false;
  const buffers: Partial<Record<keyof DeviceScreenshots, Uint8Array>> = {};
  const warn = (message: string) => { if (!warnings.includes(message)) warnings.push(message); };

  const acceptHtml = (html: string, sourceUrl: string, status: number): boolean => {
    const seo = extractSeoMetadata(html, sourceUrl);
    result.seo = seo;
    if (status < 200 || status >= 300) {
      warn(`Page returned HTTP ${status}; page content was not used.`);
      return false;
    }
    const text = extractPageText(html);
    if (isBlockedPage(seo, text)) {
      warn("Page appears to be an error or access challenge; page content was not used.");
      return false;
    }
    if (!hasSeoMetadata(seo)) {
      warn("No usable SEO metadata was found; page content was not used.");
      return false;
    }
    Object.assign(result, {
      title: seo.title, description: seo.description, text,
      seoImage: seo.imageUrl || undefined, iconUrl: seo.iconUrl,
      primaryColor: seo.themeColor || undefined,
    });
    accepted = true;
    return true;
  };

  const env = await getCloudflareEnv().catch(() => {
    warn("Browser environment unavailable; trying HTTP.");
    return undefined;
  });

  if (env?.MYBROWSER) {
    let browser: Awaited<ReturnType<typeof import("@cloudflare/puppeteer")["default"]["launch"]>> | undefined;
    let expired = false;
    const active = () => { if (expired) throw new Error("Browser crawl timed out"); };
    const close = async (instance: NonNullable<typeof browser>) => {
      await withTimeout(instance.close(), 2000, "Browser cleanup timed out").catch(() => {});
    };
    try {
      const work = (async () => {
        const puppeteer = await import("@cloudflare/puppeteer");
        active();
        const launched = await puppeteer.default.launch(env.MYBROWSER as unknown as Parameters<typeof puppeteer.default.launch>[0]);
        if (expired) {
          await close(launched);
          return;
        }
        browser = launched;
        const page = await browser.newPage();
        active();
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          try {
            if (/^https?:/i.test(request.url()) || request.isNavigationRequest()) normalizeUrl(request.url());
            void request.continue().catch(() => {});
          } catch {
            void request.abort().catch(() => {});
          }
        });
        await page.setViewport(DEVICE_VIEWPORTS.pc);
        active();
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        active();
        if (!response) throw new Error("Browser navigation returned no HTTP response");
        // Client-rendered sites may install their SEO after DOMContentLoaded.
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 4000 }).catch(() => {});
        active();
        const sourceUrl = normalizeUrl(page.url());
        const html = await page.content();
        active();
        if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) throw new Error("HTML exceeds the 2 MiB crawl limit");
        if (!acceptHtml(html, sourceUrl, response.status())) return;

        // Commit SEO before any screenshot operation, which may fail or outlive the deadline.
        for (const device of ["pc", "tablet", "mobile"] as const) {
          try {
            active();
            if (device !== "pc") await page.setViewport(DEVICE_VIEWPORTS[device]);
            active();
            const screenshot = await withTimeout(page.screenshot({ type: "png" }), 6000, `${device} screenshot timed out`);
            active();
            buffers[device] = new Uint8Array(screenshot);
          } catch {
            if (expired) return;
            warn(`${device} screenshot capture failed; SEO metadata was retained.`);
          }
        }
      })();
      await withTimeout(work, 35000, "Browser crawl timed out");
    } catch {
      warn(accepted ? "Browser capture failed after SEO extraction; metadata was retained." : "Browser crawl failed; trying HTTP.");
    } finally {
      expired = true;
      if (browser) await close(browser);
    }
  }

  if (!accepted) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      let currentUrl = url;
      for (let redirects = 0; redirects <= 5; redirects++) {
        const response = await fetch(currentUrl, {
          signal: controller.signal,
          redirect: "manual",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; HyakumeCrawler/1.0)",
            Accept: "text/html,application/xhtml+xml",
          },
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get("location");
          await response.body?.cancel();
          if (!location || redirects === 5) throw new Error("Invalid or excessive redirects");
          currentUrl = normalizeUrl(new URL(location, currentUrl).href);
          continue;
        }
        const contentType = response.headers.get("content-type") || "";
        if (!response.ok) warn(`Page returned HTTP ${response.status}; page content was not used.`);
        if (contentType && !/^(?:text\/html|application\/xhtml\+xml)(?:\s*;|$)/i.test(contentType)) {
          await response.body?.cancel();
          warn("Response was not HTML; page content was not used.");
          break;
        }
        const html = await readHtml(response);
        acceptHtml(html, currentUrl, response.status);
        break;
      }
    } catch {
      warn(controller.signal.aborted ? "HTTP crawl timed out; no page content was inferred." : "HTTP crawl failed or target was rejected; no page content was inferred.");
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }

  if (accepted) {
    if (parsedUrl.hostname === "github.com" || parsedUrl.hostname === "www.github.com") {
      const match = parsedUrl.pathname.match(/^\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/);
      if (match) result.githubUrl = `https://github.com/${match[1]}`;
    }
    if (["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(parsedUrl.hostname)) {
      const match = parsedUrl.pathname.match(/^\/([a-zA-Z0-9_]+(?:\/status\/\d+)?)/);
      if (match) result.xUrl = `https://x.com/${match[1]}`;
    }
    const fileSlug = `${parsedUrl.hostname}${options?.isSubpage ? `-sub-${parsedUrl.pathname.slice(0, 30)}` : ""}`.replace(/[^a-zA-Z0-9-]/g, "-");
    const timestamp = Date.now();
    const deviceScreenshots: DeviceScreenshots = {};
    await Promise.all((["pc", "tablet", "mobile"] as const).map(async (device) => {
      const buffer = buffers[device];
      if (!buffer) return;
      try {
        const image = await withTimeout(uploadImageToR2(`screenshots/${fileSlug}-${device}-${timestamp}.png`, buffer, "image/png"), 10000, "Screenshot upload timed out");
        deviceScreenshots[device] = image.url;
      } catch {
        warn(`${device} screenshot upload failed; SEO metadata was retained.`);
      }
    }));
    result.screenshotBuffer = buffers.pc;
    result.deviceScreenshots = deviceScreenshots;
    result.coverUrl = result.seoImage || deviceScreenshots.pc || "";
    result.usedSeoImage = Boolean(result.seoImage);
    result.screenshots = [deviceScreenshots.pc, deviceScreenshots.tablet, deviceScreenshots.mobile].filter((value): value is string => Boolean(value));
    if (!result.screenshots.length && result.coverUrl) result.screenshots.push(result.coverUrl);
  }
  if (warnings.length) result.warnings = warnings;
  return result;
}
