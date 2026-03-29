import { useEffect, useRef, useState } from "react";
import { updateTask, deleteTask } from "../../services/boardService";
import ConfirmModal from "../ui/ConfirmModal";
import SubtaskList from "./SubtaskList";
import DatePicker from "../ui/DatePicker";
import { TAG_COLORS } from "./TAG_COLORS";

const PRESET_TAGS = ["Bug", "Feature", "Design", "Docs", "Urgent", "Review"];

export default function TaskModal({ task, boardId, columnId, onClose }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [tags, setTags] = useState(task.tags || []);
  const [assignee, setAssignee] = useState(task.assignee || "");
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef();
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await updateTask(boardId, columnId, task.id, {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        tags,
        assignee: assignee.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    setConfirmDelete({
      title: "Elimina task",
      message: `Eliminare "${task.title}"?`,
      onConfirm: async () => {
        await deleteTask(boardId, columnId, task.id);
        onClose();
      },
    });
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold">Dettaglio task</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-6 py-5 overflow-y-auto">
          {/* Titolo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Titolo
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Descrizione */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Descrizione
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aggiungi una descrizione…"
              rows={3}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Scadenza + Assegnatario */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Scadenza
              </label>
              <DatePicker value={dueDate} onChange={setDueDate} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Assegna a
              </label>
              <input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Nome utente"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Tag */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    tags.includes(tag)
                      ? TAG_COLORS[tag] ?? "bg-gray-700 text-gray-400 border-gray-600"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white "
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Sottotask */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Sottotask
            </label>
            <SubtaskList
              boardId={boardId}
              columnId={columnId}
              taskId={task.id}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
          <button
            onClick={handleDelete}
            type="button"
            className="text-sm text-red-400 hover:text-red-300 border border-transparent hover:border-red-400/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Elimina
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              type="button"
              className="text-sm text-gray-400 hover:text-white border border-gray-700 px-4 py-1.5 rounded-lg transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              type="button"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              {saving ? "Salvataggio…" : "Salva"}
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.title}
          message={confirmDelete.message}
          onConfirm={confirmDelete.onConfirm}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
