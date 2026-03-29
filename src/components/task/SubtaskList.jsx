import { useEffect, useState } from "react";
import {
  subscribeToSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from "../../services/boardService";

export default function SubtaskList({ boardId, columnId, taskId }) {
  const [subtasks, setSubtasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSubtasks(boardId, columnId, taskId, setSubtasks);
    return unsub;
  }, [boardId, columnId, taskId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createSubtask(boardId, columnId, taskId, newTitle.trim());
    setNewTitle("");
    setShowForm(false);
  };

  const handleToggle = async (subtask) => {
    await updateSubtask(boardId, columnId, taskId, subtask.id, {
      completed: !subtask.completed,
    });
  };

  const handleDelete = async (subtaskId) => {
    await deleteSubtask(boardId, columnId, taskId, subtaskId);
  };

  const completed = subtasks.filter((s) => s.completed).length;

  return (
    <div className="flex flex-col gap-2">
      {/* Progress */}
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(completed / subtasks.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 shrink-0">
            {completed}/{subtasks.length}
          </span>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-1">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2 group py-1">
            <button
              onClick={() => handleToggle(subtask)}
              className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                subtask.completed
                  ? "bg-indigo-600 border-indigo-600"
                  : "border-gray-600 hover:border-indigo-500"
              }`}
            >
              {subtask.completed && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            <span
              className={`text-sm flex-1 ${subtask.completed ? "line-through text-gray-500" : "text-gray-200"}`}
            >
              {subtask.title}
            </span>
            <button
              onClick={() => handleDelete(subtask.id)}
              className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="flex gap-2 mt-1">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titolo sottotask…"
            autoFocus
            required
            className="flex-1 bg-gray-800 border border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Aggiungi
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setNewTitle("");
            }}
            className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
          >
            Annulla
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-left text-xs text-gray-500 hover:text-indigo-400 transition-colors mt-1"
        >
          + Aggiungi sottotask
        </button>
      )}
    </div>
  );
}
