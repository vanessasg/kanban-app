import { useEffect, useRef } from "react";

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Elimina",
  onConfirm,
  onClose,
}) {
  const overlayRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">{title}</h2>
          {message && <p className="text-sm text-gray-400">{message}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-white border border-gray-700 px-4 py-1.5 rounded-lg transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="text-sm bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
