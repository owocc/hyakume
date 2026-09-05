import type { CloudflareEnv } from "./lib/cf-env";

declare module "cloudflare:workers" {
  export const env: CloudflareEnv;
}
