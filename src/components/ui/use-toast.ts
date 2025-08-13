// src/components/ui/use-toast.ts
import { useEffect, useState } from "react";

export type ToastVariant = "default" | "destructive";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  /** ms para autocerrar (por defecto 4000). Usa 0 para no autocerrar. */
  duration?: number;
}

export interface ToastItem
  extends Required<Pick<ToastOptions, "variant">> {
  id: string;
  title?: string;
  description?: string;
  duration: number;
}

// -------- Store global ligera (sin provider) --------
type Listener = (items: ToastItem[]) => void;

const listeners = new Set<Listener>();
let items: ToastItem[] = [];

const notify = () => listeners.forEach((l) => l(items));
const genId = () => (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

export const toast = (opts: ToastOptions) => {
  const id = genId();
  const item: ToastItem = {
    id,
    title: opts.title,
    description: opts.description,
    variant: opts.variant ?? "default",
    duration: opts.duration ?? 4000,
  };
  items = [item, ...items];
  notify();

  if (item.duration > 0) {
    // autocierre
    setTimeout(() => dismiss(id), item.duration);
  }
  return id;
};

export const dismiss = (id?: string) => {
  if (!id) {
    items = [];
  } else {
    items = items.filter((t) => t.id !== id);
  }
  notify();
};

// Hook para lanzar toasts desde componentes
export const useToast = () => {
  return {
    toast: (o: ToastOptions) => toast(o),
    dismiss: (id?: string) => dismiss(id),
  };
};

// Hook para que el <Toaster /> reciba estado reactivo
export const useToastState = () => {
  const [state, setState] = useState<ToastItem[]>(items);
  useEffect(() => {
    const l: Listener = (it) => setState(it);
    listeners.add(l);
    // sync inicial
    setState(items);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return state;
};
