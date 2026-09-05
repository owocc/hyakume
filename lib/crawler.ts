import { getCloudflareEnv } from "./cf-env";
import { uploadImageToR2 } from "./storage";

export interface CrawlResult {
  url: string;
  title: string;
  description: string;
  text: string;
  seoImage?: string;
  iconUrl: string;
  coverUrl: string;
  screenshots: string[];
  screenshotBuffer?: Uint8Array;
  usedSeoImage: boolean;
}

/**
 * Normalize and validate URL
 */
export function normalizeUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Generate a high quality 16:9 SVG placeholder card when no screenshot or SEO image is available
 */
function generateFallback169Card(title: string, domain: string): Uint8Array {
  const safeTitle = title.replace(/[<>&"']/g, "").slice(0, 30);
  const safeDomain = domain.replace(/[<>&"']/g, "");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="100%" stop-color="#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#grad)"/>
    <circle cx="640" cy="300" r="280" fill="#3b82f6" opacity="0.08" filter="blur(60px)"/>
    <circle cx="800" cy="400" r="240" fill="#8b5cf6" opacity="0.08" filter="blur(60px)"/>
    
    <!-- Browser Mockup Window -->
    <rect x="160" y="90" width="960" height="540" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <rect x="160" y="90" width="960" height="48" rx="16" fill="#0f172a"/>
    <rect x="160" y="122" width="960" height="16" fill="#0f172a"/>
    
    <!-- Window buttons -->
    <circle cx="190" cy="114" r="6" fill="#ef4444"/>
    <circle cx="210" cy="114" r="6" fill="#eab308"/>
    <circle cx="230" cy="114" r="6" fill="#22c55e"/>
    
    <!-- Address bar -->
    <rect x="320" y="102" width="640" height="24" rx="6" fill="#1e293b"/>
    <text x="640" y="118" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto" font-size="12" text-anchor="middle">https://${safeDomain}</text>
    
    <!-- Content Preview -->
    <text x="640" y="320" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, PingFang SC" font-size="42" font-weight="bold" text-anchor="middle">${safeTitle}</text>
    <rect x="560" y="360" width="160" height="4" rx="2" fill="url(#accent)"/>
    <text x="640" y="420" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, PingFang SC" font-size="20" text-anchor="middle">Web App Store • 官方收录</text>
  </svg>`;

  return new TextEncoder().encode(svg);
}

/**
 * Parse HTML content directly to extract metadata
 */
function parseHtmlMetadata(html: string, baseUrl: string) {
  const parsedUrl = new URL(baseUrl);

  // Extract title
  let title = "";
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    title = ogTitleMatch[1].trim();
  } else if (titleTagMatch && titleTagMatch[1]) {
    title = titleTagMatch[1].trim();
  }

  // Extract description
  let description = "";
  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const descTagMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  if (ogDescMatch && ogDescMatch[1]) {
    description = ogDescMatch[1].trim();
  } else if (descTagMatch && descTagMatch[1]) {
    description = descTagMatch[1].trim();
  }

  // Extract SEO image (og:image / twitter:image)
  let seoImage = "";
  const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const twitterImgMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  const rawSeo = ogImgMatch?.[1] || twitterImgMatch?.[1];
  if (rawSeo) {
    try {
      seoImage = new URL(rawSeo, baseUrl).toString();
    } catch {
      seoImage = rawSeo;
    }
  }

  // Extract favicon
  let iconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`;
  const iconMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i);
  if (iconMatch && iconMatch[1] && iconMatch[1] !== "data:," && iconMatch[1].trim() !== "") {
    try {
      const parsedIcon = new URL(iconMatch[1], baseUrl).toString();
      if (/\.(png|jpg|jpeg|ico|svg|webp)(\?.*)?$/i.test(parsedIcon)) {
        iconUrl = parsedIcon;
      }
    } catch {
      // Keep google favicon fallback
    }
  }

  // Extract plain text snippet
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const text = cleanHtml.slice(0, 3000);

  return { title, description, seoImage, iconUrl, text };
}

/**
 * Main Web Crawler and Snapshot Handler:
 * 1. Crawl URL using Cloudflare Browser Rendering (if MYBROWSER is present) or HTTP fetch
 * 2. If SEO image exists: use SEO image as cover directly (saves space in R2)
 * 3. If NO SEO image: takes 16:9 screenshot, uploads to Cloudflare R2, returns R2 URL
 */
export async function crawlWebsite(targetUrl: string): Promise<CrawlResult> {
  const url = normalizeUrl(targetUrl);
  const parsedUrl = new URL(url);
  const env = await getCloudflareEnv();

  let title = "";
  let description = "";
  let text = "";
  let seoImage = "";
  let iconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`;
  let screenshotBuffer: Uint8Array | undefined;

  // 1. Try Cloudflare Browser Rendering if MYBROWSER binding is present (with 15s timeout)
  if (env && env.MYBROWSER) {
    try {
      const browserPromise = (async () => {
        const puppeteer = await import("@cloudflare/puppeteer");
        const browser = await puppeteer.default.launch(
          env.MYBROWSER as unknown as Parameters<typeof puppeteer.default.launch>[0]
        );
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 }); // 16:9 ratio
        await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

        // Extract metadata from DOM
        const metadata = await page.evaluate(() => {
          const getMeta = (name: string) =>
            document.querySelector(`meta[property="${name}"]`)?.getAttribute("content") ||
            document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ||
            "";

          const ogTitle = getMeta("og:title") || document.title || "";
          const ogDesc = getMeta("og:description") || getMeta("description") || "";
          const ogImg = getMeta("og:image") || getMeta("twitter:image") || "";

          const iconEl = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
          const icon = iconEl?.getAttribute("href") || "";

          const bodyText = document.body.innerText || "";
          return { ogTitle, ogDesc, ogImg, icon, bodyText: bodyText.slice(0, 3000) };
        });

        const rawScreenshot = await page.screenshot({ type: "png" });
        await browser.close();
        return { metadata, rawScreenshot };
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Browser launch timed out")), 15000)
      );

      const { metadata, rawScreenshot } = await Promise.race([
        browserPromise,
        timeoutPromise,
      ]);

      title = metadata.ogTitle || parsedUrl.hostname;
      description = metadata.ogDesc;
      text = metadata.bodyText;
      if (metadata.ogImg) {
        try {
          seoImage = new URL(metadata.ogImg, url).toString();
        } catch {
          seoImage = metadata.ogImg;
        }
      }
      if (metadata.icon && metadata.icon !== "data:," && metadata.icon.trim() !== "") {
        try {
          const parsedIcon = new URL(metadata.icon, url).toString();
          if (/\.(png|jpg|jpeg|ico|svg|webp)(\?.*)?$/i.test(parsedIcon)) {
            iconUrl = parsedIcon;
          }
        } catch {
          // keep fallback
        }
      }
      screenshotBuffer = new Uint8Array(rawScreenshot);
    } catch (browserErr) {
      console.warn("Cloudflare Browser Rendering encountered an issue, falling back to HTTP crawl:", browserErr);
    }
  }

  // 2. If title is still empty (browser rendering skipped or failed), fetch via standard HTTP
  if (!title) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (response.ok) {
        const html = await response.text();
        const parsed = parseHtmlMetadata(html, url);
        title = parsed.title || parsedUrl.hostname;
        description = parsed.description;
        text = parsed.text;
        seoImage = parsed.seoImage;
        iconUrl = parsed.iconUrl;
      }
    } catch (fetchErr) {
      console.error("Failed to fetch webpage HTML:", fetchErr);
    }
  }

  // Fallback title if still empty
  if (!title) {
    title = parsedUrl.hostname.replace(/^www\./, "");
  }

  // 3. Process Cover Image (per prompt requirement):
  // "如果有提供meta图片则使用seo图片，如果没有就由Agent 自动截图，截图后上传到 r2，并转为 url 提供网页使用"
  // "对于有seo优化的网站可以节省空间不存储图片"
  let coverUrl = "";
  let usedSeoImage = false;

  if (seoImage && seoImage.startsWith("http")) {
    // Website provides SEO image: use it directly! (Saves R2 storage space)
    coverUrl = seoImage;
    usedSeoImage = true;
  } else {
    // No SEO image provided: use 16:9 screenshot and upload to Cloudflare R2
    if (!screenshotBuffer) {
      screenshotBuffer = generateFallback169Card(title, parsedUrl.hostname);
    }

    const fileSlug = parsedUrl.hostname.replace(/[^a-zA-Z0-9]/g, "-");
    const r2Key = `covers/${fileSlug}-${Date.now()}.png`;

    const uploadResult = await uploadImageToR2(r2Key, screenshotBuffer, "image/png");
    coverUrl = uploadResult.url;
    usedSeoImage = false;
  }

  // Generate screenshot previews for the app details & search preview cards
  const screenshots = [
    coverUrl,
    seoImage || coverUrl,
    `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80`,
  ];

  return {
    url,
    title,
    description,
    text,
    seoImage: seoImage || undefined,
    iconUrl,
    coverUrl,
    screenshots,
    screenshotBuffer,
    usedSeoImage,
  };
}
