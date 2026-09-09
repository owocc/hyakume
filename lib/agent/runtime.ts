import { getCloudflareEnv } from "../cf-env";
import { resolveAiConfig } from "./config";
import { parseJsonObject, record } from "./validation";

export interface AgentPrompt {
  system: string;
  user: string;
}

export interface AgentRuntime {
  complete(prompt: AgentPrompt): Promise<unknown>;
}

interface RuntimeOptions {
  getEnv?: () => Promise<Record<string, unknown>>;
  processEnv?: Record<string, unknown>;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export function createAgentRuntime(options: RuntimeOptions = {}): AgentRuntime {
  return {
    async complete(prompt) {
      const controller = new AbortController();
      const timeoutMs = options.timeoutMs ?? 20_000;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timedOut = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`AI request timed out after ${timeoutMs}ms.`));
          controller.abort();
        }, timeoutMs);
      });
      const request = async () => {
        const env = await (options.getEnv ?? getCloudflareEnv)();
        const config = resolveAiConfig(env, options.processEnv);
        const messages = [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ];
        let response: unknown;
        if (config.provider === "cloudflare") {
          const binding = env.AI as { run?: (model: string, input: unknown) => Promise<unknown> } | undefined;
          if (!binding || typeof binding.run !== "function") {
            throw new Error("AI is unavailable: configure an AI provider or Cloudflare AI binding.");
          }
          response = await binding.run(config.model, {
            messages, temperature: 0, response_format: { type: "json_object" },
          });
        } else {
          if (!config.baseUrl) throw new Error("AI is unavailable: AI_BASE_URL is missing.");
          if (config.provider !== "custom" && !config.apiKey) {
            throw new Error("AI is unavailable: the provider API key is missing.");
          }
          const base = new URL(config.baseUrl);
          if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
            throw new Error("AI configuration has an invalid base URL.");
          }
          const endpoint = config.baseUrl.replace(/\/+$/, "") + "/chat/completions";
          const res = await (options.fetch ?? fetch)(endpoint, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
            },
            body: JSON.stringify({
              model: config.model, messages, temperature: 0,
              response_format: { type: "json_object" },
            }),
          });
          if (!res.ok) throw new Error(`AI provider request failed (HTTP ${res.status}).`);
          response = await res.json();
        }
        const envelope = record(response, "AI response");
        if (typeof envelope.response === "string") return parseJsonObject(envelope.response);
        if (envelope.response && typeof envelope.response === "object" && !Array.isArray(envelope.response)) {
          return record(envelope.response, "AI JSON response");
        }
        const choices = envelope.choices;
        if (!Array.isArray(choices) || !choices.length) throw new Error("AI returned an empty or unsupported response.");
        const choice = record(choices[0], "AI choice");
        if (choice.finish_reason && choice.finish_reason !== "stop") {
          throw new Error("AI response was incomplete or refused.");
        }
        const message = record(choice.message, "AI message");
        if (message.refusal) throw new Error("AI refused to analyze the source.");
        if (typeof message.content !== "string") throw new Error("AI returned no JSON text.");
        return parseJsonObject(message.content);
      };
      try {
        return await Promise.race([request(), timedOut]);
      } catch (error) {
        // Provider exceptions can include credentials or source content; never expose their bodies.
        if (error instanceof Error && /^AI (?:is |configuration |provider request |request timed |response |returned |refused |output )/.test(error.message)) throw error;
        throw new Error("AI request failed; check provider availability and configuration.");
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export const agentRuntime = createAgentRuntime();
