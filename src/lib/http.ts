export async function callApiWithRetry(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
  retries = 2
) {
  const timeoutMs = options.timeoutMs ?? 15000; // 15s
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      const text = await res.text();
      if (res.ok) {
        try { return JSON.parse(text); } catch { return text; }
      }

      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }

      throw new Error(`HTTP ${res.status} — ${text}`);
    }

    throw new Error("Exhausted retries without success");
  } finally {
    clearTimeout(timer);
  }
}