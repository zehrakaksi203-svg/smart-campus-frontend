import { useEffect, useState } from "react";

let listeners = [];
let idCounter = 0;

export function showToast(message, type = "info") {
  const id = ++idCounter;
  listeners.forEach((fn) => fn({ id, message, type }));
}

export function toastSuccess(message) {
  showToast(message, "success");
}

export function toastError(message) {
  showToast(message, "error");
}

const TYPE_STYLES = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  info: "bg-slate-800",
};

const TYPE_ICONS = {
  success: "✅",
  error: "⚠️",
  info: "ℹ️",
};

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (toast) => {
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };

    listeners.push(handleNewToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== handleNewToast);
    };
  }, []);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`${TYPE_STYLES[t.type]} text-white rounded-lg shadow-lg px-4 py-3 flex items-start gap-2 cursor-pointer animate-[fadeIn_0.2s_ease-out]`}
        >
          <span>{TYPE_ICONS[t.type]}</span>
          <span className="text-sm font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;