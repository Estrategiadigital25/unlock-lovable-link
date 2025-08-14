// src/components/ChatBox.tsx
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/api";
import { askChat } from "@/lib/api";

type Bubble = ChatMessage & { id: string };

export default function ChatBox() {
  const [messages, setMessages] = useState<Bubble[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "¡Hola! Soy el asistente de Ingtec. Escríbeme algo y te respondo 😊",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Bubble = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const reply = await askChat([
        { role: "system", content: "Eres el asistente de Ingtec: claro, breve y útil." },
        ...messages.map(({ role, content }) => ({ role, content } as ChatMessage)),
        { role: "user", content: text },
      ]);

      const botMsg: Bubble = { id: crypto.randomUUID(), role: "assistant", content: reply || "(sin respuesta)" };
      setMessages((m) => [...m, botMsg]);
    } catch (err: any) {
      const botMsg: Bubble = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Ups, no pude responder. Revisa la consola del navegador (F12 → Console) para ver el error y corrige CORS / URL.",
      };
      console.error("[ChatBox] Error:", err);
      setMessages((m) => [...m, botMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div className="max-w-2xl mx-auto h-[80vh] flex flex-col gap-3 p-4">
      <div className="text-xl font-semibold">Buscador GPT Ingtec</div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto border rounded-lg p-3 space-y-2 bg-white"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] px-3 py-2 rounded-xl ${
              m.role === "user"
                ? "ml-auto bg-gray-200"
                : "mr-auto bg-gray-100"
            }`}
          >
            <div className="text-sm whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="mr-auto bg-gray-100 px-3 py-2 rounded-xl text-sm">
            pensando…
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Escribe tu mensaje…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          Enviar
        </button>
      </div>
      <FootNote />
    </div>
  );
}

function FootNote() {
  return (
    <div className="text-xs text-gray-500">
      Conectado con Supabase Edge Functions para respuestas inteligentes.
    </div>
  );
}