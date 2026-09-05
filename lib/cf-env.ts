import type { R2Bucket, Fetcher, KVNamespace } from "@cloudflare/workers-types";

export interface CloudflareEnv {
  BUCKET?: R2Bucket;
  MYBROWSER?: Fetcher;
  AI?: unknown;
  VINEXT_KV_CACHE?: KVNamespace;
  [key: string]: unknown;
}

/**
 * Access Cloudflare Worker environment bindings.
 * Exception: platform-specific virtual module 'cloudflare:workers' is only available inside workerd.
 */
export async function getCloudflareEnv(): Promise<CloudflareEnv> {
  try {
    const cf = await import("cloudflare:workers");
    const environment = cf.env as unknown as CloudflareEnv;
    return environment || {};
  } catch {
    const root = globalThis as { __env__?: CloudflareEnv };
    return root.__env__ || {};
  }
}
