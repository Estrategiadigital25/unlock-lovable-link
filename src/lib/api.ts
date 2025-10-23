// src/lib/api.ts
// Versión con OpenAI API integrada

export interface ChatMessage {
  role: string;
  content: string;
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
```

### **6. Pega el código:**
- Pega todo el código que copiaste en el editor

### **7. Guarda los cambios:**
- Baja hasta abajo
- En "Commit message" escribe: `Integrate OpenAI API`
- Clic en el botón verde **"Commit changes"**

✅ **Listo! Código actualizado en GitHub**

---

## 📝 **PARTE C: AGREGAR LA LLAVE EN NETLIFY (5 min)**

### **1. Abre Netlify:**
```
https://app.netlify.com
```

### **2. Haz clic en tu sitio:**
- Busca "buscadoringtec"
- Haz clic en él

### **3. Ve a configuración:**
- En el menú de la izquierda, busca **"Site settings"**
- Haz clic

### **4. Busca Variables de Entorno:**
- En el menú de la izquierda, busca **"Environment variables"**
- Haz clic

### **5. Agrega nueva variable:**
- Haz clic en **"Add a variable"**
- O **"Add variable"** o **"Add environment variable"**

### **6. Llena los campos:**

**En "Key" escribe EXACTAMENTE esto:**
```
VITE_OPENAI_API_KEY
```

**En "Value" pega tu llave de OpenAI:**
```
sk-proj-AbC123...XyZ789
(la que copiaste antes)
```

### **7. Guarda:**
- Clic en **"Save"** o **"Add variable"**

✅ **Listo! Variable agregada**

---

## 📝 **PARTE D: HACER QUE NETLIFY ACTUALICE LA APP (3 min)**

### **Opción 1: Esperar (más fácil)**
- Netlify detecta automáticamente los cambios en GitHub
- En 2-3 minutos empezará a reconstruir tu app
- **No hagas nada, solo espera**

### **Opción 2: Forzar actualización (más rápido)**

**Si quieres que sea inmediato:**

1. En Netlify, busca arriba el tab **"Deploys"**
2. Haz clic en **"Trigger deploy"**
3. Selecciona **"Deploy site"**
4. Espera 2-3 minutos

---

## 📝 **PARTE E: ¡PROBAR QUE FUNCIONA! (2 min)**

### **1. Espera a que termine el deploy:**
- En Netlify → Deploys
- Verás un círculo amarillo girando
- Cuando se ponga **verde con ✓** = Listo

### **2. Abre tu app:**
```
https://buscadoringtec.netlify.app
```

### **3. Prueba el chat:**
- Abre o crea una conversación
- Escribe: **"Explícame qué es la ingeniería especializada"**
- Presiona Enter

### **4. ¡DEBERÍA RESPONDER CON IA REAL!**

**Si funciona verás:**
- Una respuesta larga, coherente y contextual
- NO dirá "modo demo"
- La respuesta será diferente cada vez

**Si NO funciona:**
- Verás el mensaje de "modo demo"
- Ve a la siguiente sección de troubleshooting

---

## 🆘 **SI ALGO NO FUNCIONA:**

### **Problema 1: Sigue diciendo "modo demo"**

**Solución:**
1. Ve a Netlify → Site settings → Environment variables
2. Verifica que la variable se llame **exactamente**: `VITE_OPENAI_API_KEY`
3. Verifica que el valor sea tu llave completa
4. Si está mal, edítala
5. Ve a Deploys → Trigger deploy → Deploy site
6. Espera 3 minutos
7. Prueba de nuevo

### **Problema 2: Error "Invalid API key"**

**Solución:**
1. Verifica que copiaste la llave completa (empieza con `sk-proj-` o `sk-`)
2. Verifica que no tenga espacios al principio o al final
3. Si es necesario, genera una nueva llave en OpenAI
4. Actualiza la variable en Netlify
5. Redeploy

### **Problema 3: El deploy falló**

**Solución:**
1. Ve a Netlify → Deploys
2. Haz clic en el deploy que falló
3. Lee el error (toma screenshot si no entiendes)
4. Probablemente sea un error de sintaxis en el código
5. Verifica que copiaste TODO el código correctamente

---

## ✅ **CHECKLIST - MARCA LO QUE YA HICISTE:**
```
□ Creé cuenta en OpenAI
□ Agregué método de pago
□ Creé API key
□ Copié la llave completa
□ Guardé la llave en archivo de texto
□ Edité api.ts en GitHub
□ Borré todo el contenido viejo
□ Pegué el código nuevo
□ Hice commit ("Integrate OpenAI API")
□ Abrí Netlify
□ Fui a Site settings → Environment variables
□ Agregué VITE_OPENAI_API_KEY
□ Pegué mi llave de OpenAI
□ Guardé la variable
□ Esperé el deploy (o lo forcé)
□ Abrí buscadoringtec.netlify.app
□ Probé el chat
□ ¡FUNCIONA! 🎉
