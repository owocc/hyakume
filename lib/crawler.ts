import { getCloudflareEnv } from "./cf-env";
import { uploadImageToR2 } from "./storage";

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
  seoImage?: string;
  iconUrl: string;
  coverUrl: string;
  primaryColor?: string;
  screenshots: string[];
  screenshotBuffer?: Uint8Array;
  deviceScreenshots?: DeviceScreenshots;
  usedSeoImage: boolean;
}

export const DEVICE_VIEWPORTS = {
  pc: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
} as const;
function sleep(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
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
  // Extract theme-color / primary color
  let primaryColor: string | undefined;
  const themeMatch = html.match(/<meta[^>]+name=["'](?:theme-color|msapplication-TileColor)["'][^>]+content=["']([^"']+)["']/i);
  if (themeMatch && themeMatch[1]) {
    primaryColor = themeMatch[1].trim();
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

  return { title, description, seoImage, iconUrl, text, primaryColor };
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
  let pcScreenshotBuffer: Uint8Array | undefined;
  let tabletScreenshotBuffer: Uint8Array | undefined;
  let mobileScreenshotBuffer: Uint8Array | undefined;
  let primaryColor: string | undefined;

  // 1. Try Cloudflare Browser Rendering if MYBROWSER binding is present (with 15s timeout)
  if (env && env.MYBROWSER) {
    try {
      const browserPromise = (async () => {
        const puppeteer = await import("@cloudflare/puppeteer");
        let browser;
        try {
          browser = await puppeteer.default.launch(
            env.MYBROWSER as unknown as Parameters<typeof puppeteer.default.launch>[0]
          );
          const page = await browser.newPage();

          // 1. Initial PC (Desktop) Viewport & Navigation
          await page.setViewport(DEVICE_VIEWPORTS.pc);
          try {
            await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
          } catch (navErr) {
            console.warn("Navigation with networkidle2 timed out, continuing with loaded DOM:", navErr);
          }

          // Allow web fonts and animations to settle
          try {
            await page.evaluate(() => document.fonts?.ready);
          } catch {
            // ignore
          }
          await sleep(600);

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
            const themeColor =
              document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ||
              document.querySelector('meta[name="msapplication-TileColor"]')?.getAttribute("content") ||
              "";

            // Sample colors across the page to find the dominant color (占据封面图最大的颜色)
            const colorCounts: Record<string, number> = {};
            const recordColor = (c: string | null | undefined) => {
              if (!c || c === "rgba(0, 0, 0, 0)" || c === "transparent") return;
              colorCounts[c] = (colorCounts[c] || 0) + 1;
            };

            if (themeColor) recordColor(themeColor);

            try {
              const docBg = window.getComputedStyle(document.documentElement).backgroundColor;
              const bodyBg = window.getComputedStyle(document.body).backgroundColor;
              recordColor(docBg);
              recordColor(bodyBg);

              // Sample 30 points across the top 60% of viewport (where card text and artwork sit)
              const width = window.innerWidth || 1440;
              const height = (window.innerHeight || 900) * 0.6;
              const stepX = Math.floor(width / 6);
              const stepY = Math.floor(height / 5);
              for (let x = stepX / 2; x < width; x += stepX) {
                for (let y = stepY / 2; y < height; y += stepY) {
                  const el = document.elementFromPoint(x, y);
                  if (el) {
                    const bg = window.getComputedStyle(el).backgroundColor;
                    recordColor(bg);
                  }
                }
              }
            } catch {
              // ignore
            }

            let detectedColor = themeColor || "";
            let maxFreq = 0;
            for (const [col, freq] of Object.entries(colorCounts)) {
              if (freq > maxFreq) {
                maxFreq = freq;
                detectedColor = col;
              }
            }
            return { ogTitle, ogDesc, ogImg, icon, bodyText: bodyText.slice(0, 3000), detectedColor };
          });

          // Capture PC screenshot
          let rawPcScreenshot: Uint8Array | undefined;
          try {
            const rawPc = await page.screenshot({ type: "png" });
            rawPcScreenshot = new Uint8Array(rawPc);
          } catch (pcErr) {
            console.warn("PC screenshot capture failed:", pcErr);
          }

          // 2. Switch to Tablet Viewport & capture
          let rawTabletScreenshot: Uint8Array | undefined;
          try {
            await page.setViewport(DEVICE_VIEWPORTS.tablet);
            await sleep(600);
            const rawTablet = await page.screenshot({ type: "png" });
            rawTabletScreenshot = new Uint8Array(rawTablet);
          } catch (tabErr) {
            console.warn("Tablet screenshot capture failed:", tabErr);
          }

          // 3. Switch to Mobile Viewport & capture
          let rawMobileScreenshot: Uint8Array | undefined;
          try {
            await page.setViewport(DEVICE_VIEWPORTS.mobile);
            await sleep(600);
            const rawMobile = await page.screenshot({ type: "png" });
            rawMobileScreenshot = new Uint8Array(rawMobile);
          } catch (mobErr) {
            console.warn("Mobile screenshot capture failed:", mobErr);
          }

          return {
            metadata,
            rawPcScreenshot,
            rawTabletScreenshot,
            rawMobileScreenshot,
          };
        } finally {
          if (browser) {
            await browser.close().catch(() => {});
          }
        }
      })();

      const { promise: timeoutPromise, reject: rejectTimeout } = Promise.withResolvers<never>();
      const timer = setTimeout(() => rejectTimeout(new Error("Browser launch timed out")), 35000);

      const { metadata, rawPcScreenshot, rawTabletScreenshot, rawMobileScreenshot } =
        await Promise.race([browserPromise, timeoutPromise]);
      clearTimeout(timer);

      title = metadata.ogTitle || parsedUrl.hostname;
      description = metadata.ogDesc;
      text = metadata.bodyText;
      if (metadata.detectedColor) {
        primaryColor = metadata.detectedColor;
      }
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
      pcScreenshotBuffer = rawPcScreenshot;
      tabletScreenshotBuffer = rawTabletScreenshot;
      mobileScreenshotBuffer = rawMobileScreenshot;
      screenshotBuffer = rawPcScreenshot;
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
        if (parsed.primaryColor) {
          primaryColor = parsed.primaryColor;
        }
      }
    } catch (fetchErr) {
      console.error("Failed to fetch webpage HTML:", fetchErr);
    }
  }

  // Fallback title if still empty
  if (!title) {
    title = parsedUrl.hostname.replace(/^www\./, "");
  }

  // 3. Upload Multi-Device Screenshots to Cloudflare R2 / Storage
  let pcScreenshotUrl: string | undefined;
  let tabletScreenshotUrl: string | undefined;
  let mobileScreenshotUrl: string | undefined;

  const fileSlug = parsedUrl.hostname.replace(/[^a-zA-Z0-9]/g, "-");
  const timestamp = Date.now();

  const uploadTasks: Promise<{ type: "pc" | "tablet" | "mobile"; url: string } | null>[] = [];

  if (pcScreenshotBuffer) {
    uploadTasks.push(
      uploadImageToR2(
        `screenshots/${fileSlug}-pc-${timestamp}.png`,
        pcScreenshotBuffer,
        "image/png"
      )
        .then((res) => ({ type: "pc" as const, url: res.url }))
        .catch((err) => {
          console.error("Failed to upload PC screenshot to storage:", err);
          return null;
        })
    );
  }

  if (tabletScreenshotBuffer) {
    uploadTasks.push(
      uploadImageToR2(
        `screenshots/${fileSlug}-tablet-${timestamp}.png`,
        tabletScreenshotBuffer,
        "image/png"
      )
        .then((res) => ({ type: "tablet" as const, url: res.url }))
        .catch((err) => {
          console.error("Failed to upload tablet screenshot to storage:", err);
          return null;
        })
    );
  }

  if (mobileScreenshotBuffer) {
    uploadTasks.push(
      uploadImageToR2(
        `screenshots/${fileSlug}-mobile-${timestamp}.png`,
        mobileScreenshotBuffer,
        "image/png"
      )
        .then((res) => ({ type: "mobile" as const, url: res.url }))
        .catch((err) => {
          console.error("Failed to upload mobile screenshot to storage:", err);
          return null;
        })
    );
  }

  if (uploadTasks.length > 0) {
    const uploadResults = await Promise.all(uploadTasks);
    for (const item of uploadResults) {
      if (!item) continue;
      if (item.type === "pc") pcScreenshotUrl = item.url;
      if (item.type === "tablet") tabletScreenshotUrl = item.url;
      if (item.type === "mobile") mobileScreenshotUrl = item.url;
    }
  }

  // 4. Process Cover Image
  let coverUrl = "";
  let usedSeoImage = false;

  if (seoImage && seoImage.startsWith("http")) {
    coverUrl = seoImage;
    usedSeoImage = true;
  } else if (pcScreenshotUrl) {
    coverUrl = pcScreenshotUrl;
    usedSeoImage = false;
  } else {
    // No SEO image and no PC screenshot: generate fallback card
    const fallbackBuffer = generateFallback169Card(title, parsedUrl.hostname);
    if (!primaryColor) primaryColor = "#3b82f6";
    const r2Key = `covers/${fileSlug}-${timestamp}.png`;
    const uploadResult = await uploadImageToR2(r2Key, fallbackBuffer, "image/png");
    coverUrl = uploadResult.url;
    usedSeoImage = false;
  }

  // 5. Assemble Screenshots Array (PC, Tablet, Mobile)
  const screenshots: string[] = [];
  if (pcScreenshotUrl) screenshots.push(pcScreenshotUrl);
  if (tabletScreenshotUrl) screenshots.push(tabletScreenshotUrl);
  if (mobileScreenshotUrl) screenshots.push(mobileScreenshotUrl);

  // If no device screenshots were captured (e.g. HTTP fallback crawl), fall back to cover/SEO image
  if (screenshots.length === 0) {
    if (coverUrl) screenshots.push(coverUrl);
    if (seoImage && seoImage !== coverUrl) screenshots.push(seoImage);
  }

  const deviceScreenshots: DeviceScreenshots = {
    pc: pcScreenshotUrl,
    tablet: tabletScreenshotUrl,
    mobile: mobileScreenshotUrl,
  };

  return {
    url,
    title,
    description,
    text,
    seoImage: seoImage || undefined,
    iconUrl,
    coverUrl,
    primaryColor,
    screenshots,
    screenshotBuffer,
    deviceScreenshots,
    usedSeoImage,
  };
}
