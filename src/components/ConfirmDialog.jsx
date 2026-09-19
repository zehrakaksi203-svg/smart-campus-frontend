import { useEffect, useState } from "react";

let listener = null;

export function confirmAction({
  title = "Emin misiniz?",
  message = "Bu işlem geri alınamaz.",
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  danger = true,
} = {}) {
  return new Promise((resolve) => {
    if (listener) {
      listener({ title, message, confirmLabel, cancelLabel, danger, resolve });
    } else {
      resolve(window.confirm(message));
    }
  });
}

function ConfirmDialog() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    listener = (payload) => setDialog(payload);
    return () => {
      listener = null;
    };
  }, []);

  if (!dialog) return null;

  const close = (result) => {
    dialog.resolve(result);
    setDialog(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 className="font-bold text-lg text-slate-800 mb-2">
          {dialog.title}
        </h3>
        <p className="text-sm text-slate-600 mb-6">{dialog.message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => close(false)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            {dialog.cancelLabel}
          </button>
          <button
            onClick={() => close(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${
              dialog.danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;