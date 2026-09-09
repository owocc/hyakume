import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveAiConfig } from "./config";
import { createAgentRuntime } from "./runtime";
import { parseJsonObject } from "./validation";

const prompt = { system: "Return JSON", user: "untrusted evidence" };
const env = { AI_PROVIDER: "custom", AI_BASE_URL: "https://model.example/v1/", AI_MODEL: "test-model", AI_API_KEY: "test-key" };

test("resolves binding/process config, legacy keys and explicit provider choices", () => {
  assert.equal(resolveAiConfig({}, {}).provider, "cloudflare");
  assert.equal(resolveAiConfig({ AI_PROVIDER: "cloudflare", OPENAI_API_KEY: "key" }, {}).provider, "cloudflare");
  assert.equal(resolveAiConfig({}, { OPENAI_API_KEY: "key" }).provider, "openai");
  assert.equal(resolveAiConfig({ AI_PROVIDER: "deepseek", DEEPSEEK_API_KEY: "key" }, {}).model, "deepseek-chat");
  assert.equal(resolveAiConfig({ AI_BASE_URL: "https://api.deepseek.com/v1" }, {}).provider, "deepseek");
  assert.equal(resolveAiConfig({ AI_BASE_URL: "https://custom.example/v1" }, {}).provider, "custom");
  assert.equal(resolveAiConfig({ AI_MODEL: "binding-model" }, { AI_MODEL: "process-model" }).model, "binding-model");
  assert.equal(resolveAiConfig({}, { AI_PROVIDER: "openai", AI_MODEL: "custom-model" }).model, "custom-model");
  assert.throws(() => resolveAiConfig({ AI_PROVIDER: "typo" }, {}), /unsupported provider/);
});

test("one OpenAI-compatible path requests JSON with configured model and timeout signal", async () => {
  let calls = 0;
  const runtime = createAgentRuntime({ getEnv: async () => env, processEnv: {}, fetch: async (url, init) => {
    calls++;
    assert.equal(url, "https://model.example/v1/chat/completions");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-key");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "test-model");
    assert.deepEqual(body.response_format, { type: "json_object" });
    assert.deepEqual(body.messages, [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }]);
    assert.ok(init?.signal);
    return Response.json({ choices: [{ finish_reason: "stop", message: { content: '{"name":"Canvas"}' } }] });
  } });
  assert.deepEqual(await runtime.complete(prompt), { name: "Canvas" });
  assert.equal(calls, 1);
});

for (const response of ['{"name":"Canvas"}', { name: "Canvas" }]) {
  test(`Cloudflare structured and text responses use configured model: ${typeof response}`, async () => {
    let calls = 0;
    const runtime = createAgentRuntime({ processEnv: {}, getEnv: async () => ({ AI_MODEL: "configured-cf-model", AI: {
      run: async (model: string, options: unknown) => {
        calls++;
        assert.equal(model, "configured-cf-model");
        assert.ok(options);
        return { response };
      },
    } }) });
    assert.deepEqual(await runtime.complete(prompt), { name: "Canvas" });
    assert.equal(calls, 1);
  });
}

for (const raw of ["", "```json\n{}\n```", "Here is JSON: {}", "{} trailing", "{} {}", "null", "[]", "42", '{"name":"a",}']) {
  test(`strict JSON rejects ${JSON.stringify(raw)}`, () => assert.throws(() => parseJsonObject(raw), /AI output/));
}

test("missing provider, bad response and HTTP failure never silently switch models", async () => {
  await assert.rejects(createAgentRuntime({ getEnv: async () => ({}), processEnv: {} }).complete(prompt), /AI is unavailable/);
  await assert.rejects(createAgentRuntime({ getEnv: async () => ({ AI_PROVIDER: "custom" }), processEnv: {} }).complete(prompt), /AI_BASE_URL/);
  for (const response of [{}, { choices: [] }, { choices: [{ message: { content: "{}" }, finish_reason: "length" }] }, { choices: [{ message: { content: "{}", refusal: "No" } }] }]) {
    await assert.rejects(createAgentRuntime({ getEnv: async () => env, processEnv: {}, fetch: async () => Response.json(response) }).complete(prompt));
  }
  await assert.rejects(createAgentRuntime({ getEnv: async () => env, processEnv: {}, fetch: async () => new Response("secret-key-private-page", { status: 500 }) }).complete(prompt), (error: Error) => {
    assert.match(error.message, /HTTP 500/);
    assert.doesNotMatch(error.message, /secret-key-private-page/);
    return true;
  });
  let calls = 0;
  await assert.rejects(createAgentRuntime({ processEnv: {}, getEnv: async () => ({ AI: { run: async () => { calls++; throw new Error("secret"); } } }) }).complete(prompt), /AI request failed/);
  assert.equal(calls, 1);
});

test("HTTP and non-abortable Cloudflare calls have bounded timeout", async () => {
  let signal: AbortSignal | null | undefined;
  await assert.rejects(createAgentRuntime({ getEnv: async () => env, processEnv: {}, timeoutMs: 5, fetch: async (_, options) => {
    signal = options?.signal;
    return new Promise<Response>(() => {});
  } }).complete(prompt), /timed out/);
  assert.equal(signal?.aborted, true);
  await assert.rejects(createAgentRuntime({ getEnv: async () => ({ AI: { run: async () => new Promise(() => {}) } }), processEnv: {}, timeoutMs: 5 }).complete(prompt), /timed out/);
});
