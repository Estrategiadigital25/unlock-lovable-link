// src/lib/api.ts
const BASE = (import.meta.env.VITE_API_URL as string).replace(/\/$/, "");

export async function ping() {
  const r = await fetch(`${BASE}/health`, { method: "GET" });
  if (!r.ok) throw new Error(`Health failed: ${r.status}`);
  return r.json(); // { ok: true }
}

export async function chat(messages: { role: string; content: string }[]) {
  const r = await fetch(`${BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { reply: "..." }
}
