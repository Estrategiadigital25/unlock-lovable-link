// src/components/ui/toaster.tsx
import * as React from "react";
import { X } from "lucide-react";
import { Toast, ToastTitle, ToastDescription, ToastViewport } from "./toast";
import { useToast, useToastState } from "./use-toast";

/** Evita montajes duplicados en runtime (singleton guard) */
function useSingletonGuard(key = "__APP_TOASTER_MOUNTED__") {
  const [enabled, setEnabled] = React.useState(true);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    // @ts-ignore
    if ((window as any)[key]) {
      setEnabled(false);
      return;
    }
    // @ts-ignore
    (window as any)[key] = true;

    // Limpieza en HMR/Unmount
    return () => {
      // @ts-ignore
      if ((window as any)[key]) {
        // Puedes comentar la siguiente línea si prefieres que persista entre HMR
        (window as any)[key] = false;
      }
    };
  }, [key]);
  return enabled;
}

export function Toaster() {
  const toasts = useToastState();
  const { dismiss } = useToast();
  const enabled = useSingletonGuard();

  if (!enabled) return null;

  return (
    <ToastViewport>
      {toasts.map((t) => (
        <div key={t.id} className="relative mb-2">
          <Toast variant={t.variant} title={t.title} description={t.description}>
            <button
              aria-label="Cerrar"
              className="absolute right-2 top-2 rounded p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring"
              onClick={() => dismiss(t.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </Toast>
        </div>
      ))}
    </ToastViewport>
  );
}

export default Toaster;

