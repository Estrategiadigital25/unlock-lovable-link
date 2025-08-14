// src/lib/api.ts
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AskChatResponse = {
  reply?: string;
  model?: string;
  finish_reason?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  latency_ms?: number;
  request_id?: string;
  error?: string;
  detail?: string;
};

function getApiUrl() {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (!url) {
    return "https://9zuwoytu2f.execute-api.us-east-1.amazonaws.com";
  }
  return url.replace(/\/+$/, "");
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(new Error("timeout")), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

async function doFetchWithRetry(input: RequestInfo, init: RequestInit, retries = 1) {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { signal, cancel } = withTimeout(45_000);
    try {
      const res = await fetch(input, { ...init, signal });
      cancel();
      if (!res.ok && (res.status === 429 || res.status >= 500) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (e) {
      cancel();
      lastErr = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

export async function askChat(messages: ChatMessage[], model = "gpt-4o-mini") {
  const API_URL = getApiUrl();

  const res = await doFetchWithRetry(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model }),
  }, 1);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Error API (${res.status}): ${text || "sin detalles"}\n` +
      `Tip: revisa CORS (origin), logs de CloudWatch y que la URL sea correcta.`
    );
  }

  const data = (await res.json()) as AskChatResponse;
  if (data.error) {
    throw new Error(`Error API: ${data.error}${data.detail ? " — " + data.detail : ""}`);
  }
  return data.reply ?? "";
}

/** GET /health en tu API para no gastar tokens */
export async function healthCheck() {
  try {
    const API_URL = getApiUrl();
    const { signal, cancel } = withTimeout(4000);
    const res = await fetch(`${API_URL}/health`, { method: "GET", signal });
    cancel();
    return res.ok;
  } catch {
    return false;
  }
}