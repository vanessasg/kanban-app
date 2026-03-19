import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  subscribeToBoards,
  createBoard,
  deleteBoard,
} from "../services/boardService";
import ConfirmModal from "../components/ui/ConfirmModal";

export default function Boards() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

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

  const handleDelete = (e, boardId) => {
    e.stopPropagation();
    setConfirmDelete({
      title: "Elimina board",
      message: "Eliminare questa board? L'operazione è irreversibile.",
      onConfirm: async () => await deleteBoard(boardId),
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
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

      {/* Main */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => navigate(`/board/${board.id}`)}
                className="relative bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 group"
              >
                <h2 className="font-medium text-sm">{board.title}</h2>
                <button
                  onClick={(e) => handleDelete(e, board.id)}
                  className="absolute top-3 right-3 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
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
