// src/lib/api.ts
/**
 * Cliente para Supabase Edge Functions.
 * Usa las Edge Functions integradas en lugar de API Gateway externo.
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** Llama a la Edge Function de Supabase y devuelve el texto de respuesta */
export async function askChat(messages: ChatMessage[], model = "gpt-4o-mini") {
  // URL de la Edge Function de Supabase
  const EDGE_FUNCTION_URL = `https://lozhxacampqoxmjbnekf.supabase.co/functions/v1/chat`;

  const res = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvemh4YWNhbXBxb3htamJuZWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNTQ1NjIsImV4cCI6MjA2OTYzMDU2Mn0.qKpRbXEFQyRZW4Zj1XiUkNHLdxEqK99iBkfGGEBeZFA`
    },
    body: JSON.stringify({ messages, model }),
  });

  // Si algo falla, lanza un error con detalle para verlo en consola
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Error API (${res.status}): ${text || "sin detalles"}\n` +
      `Tip: revisa los logs de la Edge Function en Supabase.`
    );
  }

  const data = (await res.json()) as { reply?: string };
  return data.reply ?? "";
}

/** Opcional: ping rápido para saber si la API responde */
export async function healthCheck() {
  try {
    // Envía un mensaje mínimo
    await askChat([{ role: "user", content: "ping" }], "gpt-4o-mini");
    return true;
  } catch {
    return false;
  }
}