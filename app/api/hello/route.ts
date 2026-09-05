import { env } from "cloudflare:workers";

export function GET() {
  return Response.json({
    message: "Hello from vinext on Cloudflare Workers",
    hasEnv: typeof env !== "undefined",
  });
}
