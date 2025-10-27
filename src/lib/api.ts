// src/lib/api.ts
// Versión con OpenAI API integrada

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileKey: string;
  }>;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export async function ping() {
  return { ok: true };
}

export async function chat(messages: { role: string; content: string }[]) {
  // Si no hay API key, usar modo demo
  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
    console.log('OpenAI API key not found, using demo mode');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      reply: "¡Hola! Soy tu asistente de Ingtec Especialidades. " +
             "(Nota: Actualmente en modo demo. Configura VITE_OPENAI_API_KEY para usar GPT real)"
    };
  }

  // Llamada real a OpenAI
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return {
      reply: data.choices[0].message.content
    };
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    
    // Fallback a modo demo si hay error
    return {
      reply: "Lo siento, hay un problema con la conexión a OpenAI. " +
             "Por favor, verifica tu API key o contacta al administrador."
    };
  }
}

export async function askChat(messages: ChatMessage[], model?: string) {
  const response = await chat(messages);
  return response.reply || response;
}
