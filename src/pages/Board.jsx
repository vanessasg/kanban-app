import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { subscribeToColumns, createColumn } from "../services/boardService";
import Column from "../components/board/Column";

export default function Board() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [columns, setColumns] = useState([]);
  const [newColTitle, setNewColTitle] = useState("");
  const [showColForm, setShowColForm] = useState(false);

  useEffect(() => {
    const unsub = subscribeToColumns(boardId, setColumns);
    return unsub;
  }, [boardId]);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    await createColumn(boardId, newColTitle.trim());
    setNewColTitle("");
    setShowColForm(false);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 h-14 flex items-center justify-between shrink-0">
        <button
          onClick={() => navigate("/boards")}
          className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          ← Board
        </button>
        <button
          onClick={() => setShowColForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showColForm ? "Annulla" : "+ Colonna"}
        </button>
      </header>

      {/* Add column form */}
      {showColForm && (
        <form
          onSubmit={handleAddColumn}
          className="flex gap-3 px-6 py-3 border-b border-gray-800 shrink-0"
        >
          <input
            value={newColTitle}
            onChange={(e) => setNewColTitle(e.target.value)}
            placeholder="Nome colonna…"
            autoFocus
            required
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors w-64"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Aggiungi
          </button>
        </form>
      )}

      {/* Columns */}
      <div className="kanban-scroll flex gap-4 p-6 overflow-x-auto flex-1 items-start">
        {columns.length === 0 ? (
          <div className="flex items-center justify-center w-full h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg">Nessuna colonna ancora.</p>
              <p className="text-sm mt-1">
                Aggiungi la prima colonna per iniziare.
              </p>
            </div>
          </div>
        ) : (
          columns.map((col) => (
            <Column key={col.id} column={col} boardId={boardId} />
          ))
        )}
      </div>
    </div>
  );
}
