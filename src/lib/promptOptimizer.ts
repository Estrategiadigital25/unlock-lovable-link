export type TargetIA = "ChatGPT" | "Claude" | "Gemini" | "Otro";
export type Mode = "AUTO" | "CON ASISTENTE BÁSICO" | "CON ASISTENTE DETALLADO" | "SIN ASISTENTE";

// Heurística simple para detectar complejidad del pedido
export function detectMode(input: string): Exclude<Mode, "AUTO" | "SIN ASISTENTE"> {
  const txt = (input || "").toLowerCase();
  const long = txt.length > 400;
  const complexKeywords = [
    "plan", "arquitectura", "análisis", "analisis", "comparativo", "pasos",
    "implementación", "implementacion", "estrategia", "profesional", "sistémico", "sistemico",
    "marco", "framework", "requisitos", "restricciones"
  ];
  const hasComplex = complexKeywords.some(k => txt.includes(k));
  return (long || hasComplex) ? "CON ASISTENTE DETALLADO" : "CON ASISTENTE BÁSICO";
}

function platformNote(target: TargetIA): string {
  switch (target) {
    case "Claude":
      return "• Nota para Claude: Aprovecha contexto largo y marcos de razonamiento.";
    case "Gemini":
      return "• Nota para Gemini: Enfatiza creatividad y análisis comparativo cuando aplique.";
    case "ChatGPT":
      return "• Nota para ChatGPT: Usa secciones claras y pasos accionables.";
    default:
      return "• Nota: Aplica mejores prácticas universales de prompts.";
  }
}

function buildOptimizedPrompt(userInput: string, target: TargetIA, mode: Exclude<Mode, "AUTO" | "SIN ASISTENTE">): string {
  // Prompt estructurado que el usuario puede copiar en la IA objetivo
  return [
    `Rol: Eres Asistente Ingtec, experta en optimización y resolución precisa.`,
    `IA objetivo: ${target}`,
    `Objetivo: Resolver la solicitud del usuario con precisión y estructura.`,
    `Entrada del usuario: "${userInput.trim()}"`,
    "Metodología 4-D:",
    "1) Deconstruir: identifica intención, entidades clave, requisitos y vacíos.",
    "2) Diagnosticar: detecta ambigüedades y define lo que falta.",
    "3) Desarrollar: selecciona técnicas óptimas (restricciones, ejemplos, razonamiento).",
    "4) Entregar: produce respuesta final con formato claro.",
    platformNote(target),
    "Especificaciones de salida:",
    "- Formato: pasos numerados, secciones, bullets concisos.",
    "- Tono: profesional y claro.",
    "- Validación: incluye supuestos si faltan datos y solicita 2-3 aclaraciones breves si es necesario.",
    mode === "CON ASISTENTE DETALLADO"
      ? "- Complejidad: permite cadena de pensamiento resumida y marcos sistemáticos."
      : "- Enfoque: solución directa y concisa.",
  ].join("\n");
}

export function optimizePrompt(input: string, target: TargetIA, mode: Mode): string {
  // Si es sin asistente, devolver el input original sin optimización
  if (mode === "SIN ASISTENTE") {
    return input.trim();
  }

  const finalMode: Exclude<Mode, "AUTO" | "SIN ASISTENTE"> = mode === "AUTO" ? detectMode(input) : mode as Exclude<Mode, "AUTO" | "SIN ASISTENTE">;
  
  // Para modos con asistente, generar respuesta directa
  if (finalMode === "CON ASISTENTE BÁSICO") {
    return generateDirectResponse(input, "básico");
  } else if (finalMode === "CON ASISTENTE DETALLADO") {
    return generateDirectResponse(input, "detallado");
  }

  return input.trim();
}

function generateDirectResponse(input: string, level: "básico" | "detallado"): string {
  const txt = input.toLowerCase();
  
  // Detectar tipo de consulta
  if (txt.includes("formula") || txt.includes("fórmula")) {
    if (level === "básico") {
      return `Te ayudo a desarrollar una fórmula para limpiador. Para darte la mejor solución necesito conocer:

**Información clave:**
• ¿Qué tipo de superficies va a limpiar? (vidrio, pisos, baños, cocina, etc.)
• ¿Prefieres ingredientes naturales o químicos comerciales?
• ¿Tienes alguna restricción de ingredientes?

**Mientras tanto, aquí tienes una fórmula básica universal:**
- 500ml de agua destilada
- 250ml de vinagre blanco
- 2 cucharadas de bicarbonato de sodio
- 10 gotas de aceite esencial (opcional, para aroma)

¿Podrías especificar el uso específico para optimizar la fórmula?`;
    } else {
      return `Perfecto, te ayudo a desarrollar una fórmula de limpiador profesional. Necesito hacer un análisis completo:

**Análisis de requerimientos:**
1. **Tipo de limpiador**: ¿Desengrasante, desinfectante, multiusos, específico?
2. **Superficies objetivo**: Detalles específicos del material a limpiar
3. **Nivel de suciedad**: Ligera, moderada, pesada, grasa industrial
4. **Restricciones**: Toxicidad, costo, disponibilidad de ingredientes
5. **Volumen de producción**: Casero, pequeña escala, industrial

**Formulación base recomendada:**
- **Tensioactivos**: 5-15% (para reducir tensión superficial)
- **Solventes**: 10-30% (isopropanol, etanol)
- **Quelantes**: 0.1-1% (EDTA para dureza del agua)
- **pH reguladores**: Según necesidad
- **Agua**: Completar a 100%

**Preguntas de profundización:**
• ¿Qué presupuesto manejas por litro?
• ¿Requiere certificaciones específicas?
• ¿Tienes experiencia previa en formulación química?

Con esta información podré diseñar la fórmula exacta y proceso de manufactura.`;
    }
  }
  
  // Respuesta genérica para otras consultas
  if (level === "básico") {
    return `Claro, te ayudo con tu consulta. Para darte la mejor respuesta necesito algunos detalles:

**Información que me ayudaría:**
• ¿Podrías ser más específico sobre lo que necesitas?
• ¿Hay algún contexto particular o restricción?
• ¿Qué nivel de detalle buscas en la respuesta?

**Mientras tanto:** Basándome en tu consulta inicial, puedo ofrecerte una orientación general, pero con más detalles podré ser mucho más preciso y útil.

¿Podrías ampliar un poco más tu solicitud?`;
  } else {
    return `Excelente consulta. Para proporcionarte una respuesta integral y estructurada, necesito hacer un análisis completo:

**Metodología de análisis:**
1. **Deconstrucción**: Identificar objetivos específicos y variables clave
2. **Diagnóstico**: Evaluar el contexto y restricciones
3. **Desarrollo**: Seleccionar el enfoque más efectivo
4. **Entrega**: Solución estructurada y accionable

**Información necesaria para optimizar mi respuesta:**
• Contexto específico de tu situación
• Objetivos principales y secundarios
• Restricciones de tiempo, presupuesto o recursos
• Nivel de experiencia en el tema
• Resultados esperados

**Enfoque inicial:** Basándome en tu consulta, puedo estructurar una respuesta preliminar, pero con los detalles adicionales podré ofrecerte un plan detallado con pasos específicos, consideraciones técnicas y recomendaciones profesionales.

¿Podrías proporcionar estos detalles para desarrollar la solución más efectiva?`;
  }
}
