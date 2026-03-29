import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { it } from "react-day-picker/locale";
import "react-day-picker/style.css";

export default function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const selected = value ? new Date(value) : undefined;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (date) => {
    if (!date) {
      onChange("");
      setOpen(false);
      return;
    }
    // formato YYYY-MM-DD per compatibilità con il resto dell'app
    const formatted = date.toISOString().split("T")[0];
    onChange(formatted);
    setOpen(false);
  };

  const formatDisplay = (dateStr) => {
    if (!dateStr) return "Seleziona data…";
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full text-left bg-gray-800 border rounded-lg px-3 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
          open ? "border-indigo-500" : "border-gray-700 hover:border-gray-600"
        } ${value ? "text-white" : "text-gray-500"}`}
      >
        <span>{formatDisplay(value)}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-gray-500 hover:text-red-400 transition-colors text-base leading-none"
            >
              ×
            </span>
          )}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 px-3 pb-2 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={it}
            captionLayout="dropdown"
            style={{
              "--rdp-accent-color": "#6366f1",
              "--rdp-accent-background-color": "rgba(99,102,241,0.15)",
              "--rdp-background-color": "transparent",
              "--rdp-color": "#e8e8f0",
              "--rdp-day_button-width": "36px",
              "--rdp-day_button-height": "36px",
              "--rdp-day-height": "36px",
              "--rdp-day-width": "36px",
            }}
          />
        </div>
      )}
    </div>
  );
}
