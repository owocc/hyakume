export interface AiConfig {
  provider: "cloudflare" | "openai" | "deepseek" | "custom";
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export function resolveAiConfig(
  env: Record<string, unknown>,
  processEnv: Record<string, unknown> = typeof process === "undefined" ? {} : process.env,
): AiConfig {
  const get = (key: string): string => {
    const value = env[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    const fallback = processEnv[key];
    return typeof fallback === "string" ? fallback.trim() : "";
  };
  const provider = get("AI_PROVIDER").toLowerCase();
  const apiKey = get("AI_API_KEY") || get("OPENAI_API_KEY") || get("DEEPSEEK_API_KEY");
  const baseUrl = get("AI_BASE_URL");
  const model = get("AI_MODEL");
  if (provider === "deepseek" || (!provider && baseUrl.includes("deepseek"))) {
    return { provider: "deepseek", model: model || "deepseek-chat", apiKey, baseUrl: baseUrl || "https://api.deepseek.com/v1" };
  }
  if (provider === "openai" || (!provider && apiKey && !baseUrl)) {
    return { provider: "openai", model: model || "gpt-4o-mini", apiKey, baseUrl: baseUrl || "https://api.openai.com/v1" };
  }
  if (provider === "custom" || (provider !== "cloudflare" && baseUrl)) {
    return { provider: "custom", model: model || "gpt-4o-mini", apiKey, baseUrl };
  }
  if (provider && provider !== "cloudflare") throw new Error("AI configuration has an unsupported provider.");
  return { provider: "cloudflare", model: model || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", apiKey, baseUrl };
}
