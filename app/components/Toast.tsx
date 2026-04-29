"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  useEffect(() => {
    if (!t.duration || t.duration < 0) return;
    const timer = setTimeout(onDismiss, t.duration);
    return () => clearTimeout(timer);
  }, [t.duration, onDismiss]);

  const colors: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
    success: { bg: "rgba(76,175,125,0.12)", border: "rgba(76,175,125,0.25)", icon: "✓", iconColor: "#4CAF7D" },
    error:   { bg: "rgba(224,85,85,0.12)",  border: "rgba(224,85,85,0.25)",  icon: "✕", iconColor: "#E05555" },
    info:    { bg: "rgba(56,152,236,0.12)", border: "rgba(56,152,236,0.25)", icon: "i", iconColor: "#3898EC" },
    loading: { bg: "rgba(172,198,233,0.08)", border: "rgba(172,198,233,0.15)", icon: "◌", iconColor: "#ACC6E9" },
  };
  const c = colors[t.type];

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        minWidth: 260, maxWidth: 380,
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        animation: "toastIn 0.2s ease-out",
      }}
    >
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
        color: c.iconColor, flexShrink: 0, width: 16, textAlign: "center",
      }}>
        {c.icon}
      </span>
      <span style={{
        fontFamily: "var(--font-sans)", fontSize: 13, color: "#fff", flex: 1, lineHeight: 1.4,
      }}>
        {t.message}
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(172,198,233,0.4)", fontSize: 16, lineHeight: 1,
          padding: 0, flexShrink: 0,
        }}
      >×</button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", duration = 4000): string => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        position: "fixed", bottom: 24, right: 24,
        display: "flex", flexDirection: "column", gap: 8,
        zIndex: 9999,
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
