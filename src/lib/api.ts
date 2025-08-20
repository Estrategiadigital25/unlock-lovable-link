// src/lib/api.ts
const BASE = (import.meta.env.VITE_API_URL as string || 'https://9zuwoytu2f.execute-api.us-east-1.amazonaws.com').replace(/\/$/, "");

export interface ChatMessage {
  role: string;
  content: string;
}

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

export async function askChat(messages: ChatMessage[], model?: string) {
  const response = await chat(messages);
  return response.reply || response;
}
