"use client";

export interface ToastData {
  message: string;
  type: "error" | "info";
}

export default function Toast({ toast }: { toast: ToastData | null }) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2">
      {toast ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur ${
            toast.type === "error"
              ? "border-rose-500/60 bg-rose-950/80 text-rose-200"
              : "border-emerald-500/60 bg-emerald-950/80 text-emerald-200"
          }`}
          style={{ animation: "toast-in 0.25s ease-out" }}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
