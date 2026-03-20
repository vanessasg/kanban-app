import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToBoards,
  createBoard,
  deleteBoard,
  reorderBoards,
} from "../services/boardService";
import ConfirmModal from "../components/ui/ConfirmModal";

const ACCENT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
];

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function BoardCard({ board, index, onOpen, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 group"
      onClick={onOpen}
    >
      {/* Accent bar */}
      <div className="h-1 w-full" style={{ background: accent }} />

      <div className="p-5 flex flex-col gap-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 right-8 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>

        <h2 className="font-semibold text-sm text-white pr-6 leading-snug">
          {board.title}
        </h2>

        <p className="text-xs text-gray-500">
          Creata il {formatDate(board.createdAt)}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-3 right-3 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          width="14"
          height="14"
          fill="currentColor"
        >
          <path d="M504.6 148.5C515.9 134.9 514.1 114.7 500.5 103.4C486.9 92.1 466.7 93.9 455.4 107.5L320 270L184.6 107.5C173.3 93.9 153.1 92.1 139.5 103.4C125.9 114.7 124.1 134.9 135.4 148.5L278.3 320L135.4 491.5C124.1 505.1 125.9 525.3 139.5 536.6C153.1 547.9 173.3 546.1 184.6 532.5L320 370L455.4 532.5C466.7 546.1 486.9 547.9 500.5 536.6C514.1 525.3 515.9 505.1 504.6 491.5L361.7 320L504.6 148.5z" />
        </svg>
      </button>
    </div>
  );
}

export default function Boards() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    const unsub = subscribeToBoards(user.uid, setBoards);
    return unsub;
  }, [user.uid]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const ref = await createBoard(user.uid, newTitle.trim());
      setNewTitle("");
      setShowForm(false);
      navigate(`/board/${ref.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = boards.findIndex((b) => b.id === active.id);
    const newIndex = boards.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(boards, oldIndex, newIndex);
    await reorderBoards(user.uid, reordered);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 px-6 h-14 flex items-center justify-between">
        <span className="font-semibold tracking-tight">Kanban</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {user.displayName || user.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            Esci
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Le mie board
          </h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? "Annulla" : "+ Nuova board"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="flex gap-3 mb-8 max-w-md">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nome della board…"
              autoFocus
              required
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {creating ? "…" : "Crea"}
            </button>
          </form>
        )}

        {boards.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p className="text-lg">Nessuna board ancora.</p>
            <p className="text-sm mt-1">
              Crea la tua prima board per iniziare!
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={boards.map((b) => b.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {boards.map((board, i) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    index={i}
                    onOpen={() => navigate(`/board/${board.id}`)}
                    onDelete={() =>
                      setConfirmDelete({
                        title: "Elimina board",
                        message: `Eliminare "${board.title}"? L'operazione è irreversibile.`,
                        onConfirm: async () => await deleteBoard(board.id),
                      })
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

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
