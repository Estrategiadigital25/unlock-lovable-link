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
  const optimized = buildOptimizedPrompt(input, target, finalMode);

  if (finalMode === "CON ASISTENTE BÁSICO") {
    return [
      "Tu prompt optimizado:",
      optimized,
      "",
      "Qué cambió:",
      "• Se definió un rol claro y el objetivo.",
      "• Se estructuró el formato de salida y el tono.",
      "• Se indicaron supuestos/validaciones y se redujo la ambigüedad.",
    ].join("\n");
  }

  // CON ASISTENTE DETALLADO
  return [
    "Tu prompt optimizado:",
    optimized,
    "",
    "Mejoras clave:",
    "• Rol y objetivo explícitos para reducir desviaciones.",
    "• Estructura 4-D para mayor claridad y completitud.",
    "• Especificaciones de salida con validación de supuestos.",
    "• Preparado para ejemplos de pocos disparos y cadena de pensamiento resumida.",
    "",
    "Técnicas aplicadas: Asignación de rol, capas de contexto, especificaciones de salida, descomposición de tareas, (opcional) cadena de pensamiento y pocos disparos.",
    "",
    "Consejo profesional: Ajusta el nivel de detalle y agrega 1-2 ejemplos reales del contexto cuando busques consistencia en el estilo o formato.",
  ].join("\n");
}
