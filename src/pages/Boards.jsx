import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
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
  updateBoard
} from "../services/boardService";
import ConfirmModal from "../components/ui/ConfirmModal";
import Header from "../components/ui/Header";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(board.title);

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
      className="relative bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 group min-w-50"
      onClick={() => !editingTitle && onOpen()}
    >
      <div className="h-1 w-full" style={{ background: accent }} />

      <div className="p-5 flex flex-col gap-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 right-8 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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

        {editingTitle ? (
          <input
            className="text-sm font-semibold bg-transparent border-b border-indigo-500 focus:outline-none text-white pr-6"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={async () => {
              if (title.trim())
                await updateBoard(board.id, { title: title.trim() });
              setEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.target.blur();
              if (e.key === "Escape") {
                setTitle(board.title);
                setEditingTitle(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-1.5 group/title pr-6">
            <h2 className="font-semibold text-sm text-white leading-snug">
              {title}
            </h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingTitle(true);
              }}
              className="text-gray-600 hover:text-indigo-400 opacity-100 group-hover/title:opacity-100 transition-all shrink-0"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        )}

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
        className="absolute top-3 right-3 text-gray-600 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
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
  useDocumentTitle(user?.displayName || user?.email)

  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [search, setSearch] = useState("");

  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
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
    <div className="min-h-screen flex flex-col">
      <Header user={user} onLogout={handleLogout}>
        <div className="flex justify-center items-center gap-3">
          <div className="relative max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca board…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors hidden sm:inline-flex"
          >
            {showForm ? "Annulla" : "+ Nuova board"}
          </button>
        </div>
      </Header>

      <main className="w-full max-w-5xl mx-auto px-6 py-10">
        <div
          className={`flex items-center justify-between  ${boards.length === 0 ? "flex-col gap-10 mb-0" : "mb-8"}`}
        >
          <h1 className="text-2xl font-semibold tracking-tight">
            Le mie board
          </h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors inline-flex sm:hidden"
          >
            {showForm ? "Annulla" : "+ Nuova board"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className={`flex gap-3 mb-8 py-3 max-w-md ${boards.length === 0 ? "mx-auto" : ""}`}>
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
          <div className="text-center py-10 sm:py-24 text-gray-500">
            <p className="text-lg">Nessuna board ancora.</p>
            <p className="text-sm mt-1">
              Crea la tua prima board per iniziare!
            </p>
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p className="text-lg">Nessun risultato per "{search}"</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredBoards.map((b) => b.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredBoards.map((board, i) => (
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
