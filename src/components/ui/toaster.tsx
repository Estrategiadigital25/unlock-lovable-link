// src/components/ui/toaster.tsx
import { X } from "lucide-react"
import { Toast, ToastTitle, ToastDescription, ToastViewport } from "@/components/ui/toast"
import { useToast, useToastState } from "@/components/ui/use-toast"

export function Toaster() {
  const toasts = useToastState()
  const { dismiss } = useToast()

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
  )
}

export default Toaster
