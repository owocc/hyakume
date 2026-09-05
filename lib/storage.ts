import { getCloudflareEnv } from "./cf-env";
import fs from "node:fs";
import path from "node:path";

export interface UploadResult {
  url: string;
  key: string;
  storedInR2: boolean;
}

/**
 * Upload an image buffer or Uint8Array to Cloudflare R2 (or local fallback).
 */
export async function uploadImageToR2(
  key: string,
  buffer: Uint8Array | ArrayBuffer,
  contentType: string = "image/png"
): Promise<UploadResult> {
  const env = await getCloudflareEnv();
  const cleanKey = key.replace(/^\/+/, "");

  if (env && env.BUCKET) {
    await env.BUCKET.put(cleanKey, buffer, {
      httpMetadata: { contentType },
    });
    // Return relative URL pointing to our image serving API route
    return {
      url: `/api/images/${cleanKey}`,
      key: cleanKey,
      storedInR2: true,
    };
  }

  // Local fallback: save to .data/images/
  try {
    const imagesDir = path.join(process.cwd(), ".data", "images");
    const targetPath = path.join(imagesDir, cleanKey);
    const targetFolder = path.dirname(targetPath);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    const nodeBuf = Buffer.from(buffer as ArrayBuffer);
    fs.writeFileSync(targetPath, nodeBuf);

    return {
      url: `/api/images/${cleanKey}`,
      key: cleanKey,
      storedInR2: false,
    };
  } catch (err) {
    console.error("Local storage error:", err);
    // If filesystem write fails, return base64 data URL as extreme fallback
    const base64 = Buffer.from(buffer as ArrayBuffer).toString("base64");
    return {
      url: `data:${contentType};base64,${base64}`,
      key: cleanKey,
      storedInR2: false,
    };
  }
}

/**
 * Retrieve an image from Cloudflare R2 or local fallback storage.
 */
export async function getImageFromStorage(
  key: string
): Promise<{ data: Uint8Array; contentType: string } | null> {
  const cleanKey = key.replace(/^\/+/, "");
  const env = await getCloudflareEnv();

  if (env && env.BUCKET) {
    const object = await env.BUCKET.get(cleanKey);
    if (!object) return null;
    const arrayBuffer = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType || "image/png";
    return {
      data: new Uint8Array(arrayBuffer),
      contentType,
    };
  }

  // Local fallback
  try {
    const targetPath = path.join(process.cwd(), ".data", "images", cleanKey);
    if (fs.existsSync(targetPath)) {
      const buf = fs.readFileSync(targetPath);
      return {
        data: new Uint8Array(buf),
        contentType: cleanKey.endsWith(".jpg") || cleanKey.endsWith(".jpeg") ? "image/jpeg" : "image/png",
      };
    }
  } catch (err) {
    console.error("Failed to read local image:", err);
  }

  return null;
}
